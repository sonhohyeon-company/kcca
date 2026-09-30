"use client";

import Link from "next/link";
import { useState } from "react";
import { isUploadUrl } from "@/app/admin/validate";
import { boards, isBoardSlug } from "@/lib/boards";
import type { Attachment } from "@/lib/db";
import { formatBytes } from "@/lib/format";
import { bodyImages } from "@/lib/markup";
import { BodyEditor, type UploadImage } from "./body-editor";
import {
  FormMessage,
  fieldError,
  useFormAction,
  type FormAction,
} from "./forms";

export type PostFormValues = {
  board: string;
  category: string;
  title: string;
  body: string;
  cover: string | null;
  attachments: Attachment[];
  pinned: boolean;
  /** datetime-local value in Korea time */
  createdAt: string;
};

const attachmentTypes =
  ".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.gif";

/** Radio value for the stored cover: "auto" (first body image), "none" or a URL. */
function initialCover({ cover, body }: PostFormValues) {
  const first = bodyImages(body).find(isUploadUrl);
  if (!cover) return first ? "none" : "auto";
  return cover === first ? "auto" : cover;
}

export function PostForm({
  action,
  deleteAction,
  uploadImage,
  initial,
  categories,
}: {
  action: FormAction;
  deleteAction?: () => Promise<void>;
  uploadImage: UploadImage;
  initial: PostFormValues;
  /** Categories already used, per board. */
  categories: Record<string, string[]>;
}) {
  const { state, pending, onSubmit, form } = useFormAction(action);
  const [board, setBoard] = useState(initial.board);
  const [category, setCategory] = useState(initial.category);
  const [body, setBody] = useState(initial.body);
  const [cover, setCover] = useState(() => initialCover(initial));
  const f = (name: string, hint = false) => fieldError(state, name, hint);

  const layout = isBoardSlug(board) ? boards[board].layout : "list";
  const images = [...new Set(bodyImages(body).filter(isUploadUrl))];
  const keptCover =
    initial.cover &&
    isUploadUrl(initial.cover) &&
    !images.includes(initial.cover)
      ? initial.cover
      : null;
  // The first body image is the "auto" choice, so it is not offered a second time.
  const pickable = keptCover
    ? [...images.slice(1), keptCover]
    : images.slice(1);
  // A picked body image that was since deleted from the body falls back to "auto".
  const choice = ["auto", "none", "upload", ...pickable].includes(cover)
    ? cover
    : "auto";
  const known = categories[board] ?? [];

  const radio = (value: string) => ({
    type: "radio" as const,
    name: "cover",
    value,
    checked: choice === value,
    onChange: () => setCover(value),
  });

  return (
    <>
      <FormMessage state={state} />
      <form ref={form} method="post" className="form-grid" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="board">게시판</label>
          <select
            id="board"
            name="board"
            value={board}
            onChange={(event) => setBoard(event.target.value)}
            required
            {...f("board").input}
          >
            {Object.entries(boards).map(([slug, item]) => (
              <option key={slug} value={slug}>
                {item.title}
              </option>
            ))}
          </select>
          {f("board").message}
        </div>

        <div className="field">
          <label htmlFor="category">분류 (선택)</label>
          <p className="hint" id="category-hint">
            {layout === "artwork"
              ? "공모전 이름이나 전시 이름을 적으면 갤러리에서 묶어 보여 줍니다."
              : "비워 두어도 됩니다. 예: 출간 소식, 교육 안내"}
          </p>
          <input
            id="category"
            name="category"
            list="category-list"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            maxLength={60}
            {...f("category", true).input}
          />
          <datalist id="category-list">
            {known.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {known.length > 0 && (
            <div
              className="chip-row"
              role="group"
              aria-label="이 게시판에서 쓴 분류"
            >
              {known.map((name) => (
                <button
                  key={name}
                  type="button"
                  className="btn small secondary"
                  aria-pressed={category === name}
                  onClick={() => setCategory(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          {f("category").message}
        </div>

        <div className="field">
          <label htmlFor="title">제목</label>
          {layout === "artwork" && (
            <p className="hint" id="title-hint">
              수상작은 ‘상훈_작가명’으로 적어 주세요. 예: 은상_김현희
            </p>
          )}
          <input
            id="title"
            name="title"
            defaultValue={initial.title}
            required
            maxLength={200}
            {...f("title", layout === "artwork").input}
          />
          {f("title").message}
        </div>

        <BodyEditor
          value={body}
          onChange={setBody}
          uploadImage={uploadImage}
          hint="사진은 [사진 넣기] 버튼으로 넣습니다. 여러 장을 한 번에 고를 수 있습니다."
          error={state.errors?.body}
        />

        {layout === "list" ? (
          <input type="hidden" name="cover" value={choice} />
        ) : (
          <fieldset className="cover-picker">
            <legend>대표 이미지</legend>
            <p className="hint">
              갤러리 목록과 첫 화면에 보이는 사진입니다. 보통은 본문 첫 사진을
              그대로 씁니다.
            </p>
            <ul className="cover-options">
              <li>
                <label className="check">
                  <input {...radio("auto")} />
                  {images[0] && <img src={images[0]} alt="" />}
                  <span>
                    본문 첫 사진
                    {!images[0] && " (지금은 본문에 사진이 없습니다)"}
                  </span>
                </label>
              </li>
              {pickable.map((url, index) => (
                <li key={url}>
                  <label className="check">
                    <input {...radio(url)} />
                    <img src={url} alt="" />
                    <span>
                      {url === keptCover
                        ? "지금 대표 이미지"
                        : `본문 사진 ${index + 2}번째`}
                    </span>
                  </label>
                </li>
              ))}
              <li>
                <label className="check">
                  <input {...radio("upload")} />
                  <span>새 사진 올리기</span>
                </label>
                <input
                  type="file"
                  name="coverFile"
                  accept="image/*"
                  aria-label="대표 이미지로 올릴 사진"
                  {...f("cover").input}
                  onChange={(event) => {
                    if (event.currentTarget.files?.length) setCover("upload");
                  }}
                />
              </li>
              <li>
                <label className="check">
                  <input {...radio("none")} />
                  <span>대표 이미지 없음</span>
                </label>
              </li>
            </ul>
            {f("cover").message}
          </fieldset>
        )}

        <fieldset className="field">
          <legend>첨부파일</legend>
          {initial.attachments.length > 0 && (
            <ul className="attachment-list">
              {initial.attachments.map((file) => (
                <li key={file.url}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                    <span className="sr-only"> (새 창)</span>
                  </a>
                  <span className="meta">{formatBytes(file.size)}</span>
                  <label className="check">
                    <input
                      type="checkbox"
                      name="removeAttachment"
                      value={file.url}
                    />
                    <span>
                      지우기<span className="sr-only">: {file.name}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <label htmlFor="attachments">
            {initial.attachments.length ? "파일 더 올리기" : "파일 올리기"}
          </label>
          <p className="hint" id="attachments-hint">
            PDF, 한글(HWP), 워드·엑셀·파워포인트, ZIP, 사진 파일을 한 파일에
            20MB까지 올릴 수 있습니다. 여러 파일을 한 번에 고를 수 있습니다.
          </p>
          <input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept={attachmentTypes}
            {...f("attachments", true).input}
          />
          {f("attachments").message}
        </fieldset>

        <div className="field">
          <label htmlFor="createdAt">등록일시</label>
          <p className="hint" id="createdAt-hint">
            게시판에 보이는 날짜입니다(한국 시간).
          </p>
          <input
            id="createdAt"
            name="createdAt"
            type="datetime-local"
            defaultValue={initial.createdAt}
            required
            {...f("createdAt", true).input}
          />
          {f("createdAt").message}
        </div>

        <label className="check">
          <input
            type="checkbox"
            name="pinned"
            defaultChecked={initial.pinned}
          />
          <span>목록 맨 위에 고정합니다</span>
        </label>

        <div className="form-actions">
          <button className="btn" disabled={pending}>
            {pending ? "저장하는 중…" : "저장"}
          </button>
          <Link className="btn secondary" href={`/admin/posts?board=${board}`}>
            취소
          </Link>
        </div>
      </form>

      {deleteAction && (
        <form
          className="danger-zone"
          action={deleteAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                "이 글을 삭제할까요? 글과 첨부파일은 되돌릴 수 없습니다.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          <button type="submit" className="btn danger">
            이 글 삭제
          </button>
        </form>
      )}
    </>
  );
}
