# 한국청목캘리그라피예술협회 홈페이지

(사)한국청목캘리그라피예술협회 공식 홈페이지(kcca-society.kr)입니다. imweb에서 운영하던 사이트를 옮겨 온 것으로, 협회 소개·자격증 안내·게시판(공지, 활동, 공모전, 갤러리)·자격검정 시험 접수 신청서를 제공합니다. 글과 사진은 협회 직원이 관리자 화면(`/admin`)에서 직접 올립니다. 회원 가입, 댓글, 쇼핑 기능은 없습니다.

## 구조

- Next.js 16 App Router, `output: "standalone"`. Node 서버 하나(`node server.js`)를 Docker 컨테이너로 운영합니다.
- DB는 Node 내장 `node:sqlite`입니다. 별도 DB 서버가 없습니다.
- 올린 사진은 sharp로 WebP로 바꿉니다. 긴 변을 2400px 이하로 줄이고 촬영 위치 같은 정보는 지웁니다.
- 모든 데이터는 `DATA_DIR` 한 폴더에 있습니다. 운영에서는 Docker 볼륨 `/data`입니다.

```
DATA_DIR/
  kcca.db (+ -wal, -shm)  글, 페이지, 설정, 신청서
  uploads/                공개 파일: 본문 사진, 대표 이미지, 첨부파일 (/uploads/<이름>)
  private/                신청서 첨부파일 (관리자만 내려받기)
```

| 위치                          | 내용                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `app/(site)/`                 | 공개 페이지. `[board]/`는 게시판 목록·글, `application-form/`은 신청서 |
| `app/admin/`                  | 관리자 화면                                                            |
| `app/uploads/[name]/route.ts` | 업로드 파일 제공                                                       |
| `lib/boards.ts`               | 게시판·메뉴·옛 imweb 주소                                              |
| `lib/db.ts`, `lib/schema.ts`  | DB 읽기·쓰기, 테이블                                                   |
| `lib/markup.tsx`              | 본문 문법                                                              |
| `lib/site.ts`                 | 연락처·주소                                                            |
| `scripts/import-imweb.ts`     | imweb 글·사진·첨부파일 가져오기                                        |
| `deploy/`                     | 운영 서버 Compose, 배포 스크립트, 호스트 nginx 예시                    |

## 환경 변수

| 이름             | 설명                                                                                                                 | 예                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `ADMIN_PASSWORD` | 관리자 비밀번호. 12자보다 짧거나 비어 있으면 관리자 로그인이 꺼집니다. 바꾸면 로그인한 모든 관리자가 로그아웃됩니다. | 16자 이상 권장            |
| `DATA_DIR`       | DB·업로드 폴더. 기본값 `./data`. Docker에서는 `/data`로 고정됩니다.                                                  | `/data`                   |
| `SITE_URL`       | 사이트 공개 주소. 메타데이터, 사이트맵, 링크 미리보기에 씁니다.                                                      | `https://kcca-society.kr` |
| `ALLOW_INDEXING` | `true`일 때만 검색엔진 수집을 허용합니다. 공식 도메인으로 전환한 뒤에 켭니다.                                        | `false`                   |

비밀번호에는 영문, 숫자, `-`, `_`만 쓰세요. `$`, `#`, 따옴표, 공백은 설정 파일에서 다르게 읽힐 수 있습니다.

## 로컬 개발

Node.js 24 이상이 필요합니다.

```sh
npm ci
cp .env.example .env.local     # ADMIN_PASSWORD를 12자 이상으로 적습니다
npm run import:imweb           # 현재 imweb 글·사진·첨부파일을 ./data로 가져옵니다
npm run dev
```

사이트는 http://localhost:3000 , 관리자 화면은 http://localhost:3000/admin 입니다.

- 가져오기는 여러 번 실행해도 됩니다. 이미 있는 글(같은 번호)은 건너뛰므로 관리자가 고친 내용을 덮어쓰지 않습니다. `--dry-run`은 저장하지 않고 계획만 보여 주고, `--update-views`는 기존 글의 조회수를 imweb 값으로 올립니다.
- 가져오기는 `.env.local`을 읽지 않습니다. `DATA_DIR`을 바꿨다면 `DATA_DIR=경로 npm run import:imweb`으로 실행합니다.
- 검사: `npm run typecheck`, `npm test`, `npm run build` (빌드 중 Google Fonts를 받으므로 인터넷이 필요합니다)
- 운영과 같은 이미지로 확인하려면:

```sh
docker build -t kcca .
docker run --rm -p 8080:8080 -e ADMIN_PASSWORD=local-password-1234 -v kcca-local:/data kcca
```

## 관리자 안내 (협회 직원용)

### 로그인

- 주소창에 `kcca-society.kr/admin`을 입력하고 비밀번호를 넣습니다. 비밀번호는 서버 담당자에게 받습니다.
- 비밀번호를 5번 틀리면 15분 동안 로그인할 수 없습니다.
- 12시간이 지나면 자동으로 로그아웃됩니다. 여러 사람이 쓰는 컴퓨터에서는 일을 마친 뒤 꼭 '로그아웃'을 누르세요.

### 글쓰기와 수정

1. 관리자 첫 화면(대시보드)에서 '새 글 쓰기'를 누르거나, 게시판 이름 옆의 '새 글'을 누릅니다.
2. 제목과 본문을 씁니다. 분류가 있는 게시판(예: 수상작 갤러리의 공모전)은 분류도 고릅니다.
3. '저장'을 누르면 홈페이지에 바로 올라갑니다.

- 고칠 때는 위쪽 '게시글' 메뉴에서 제목을 누르고, 고친 뒤 다시 저장합니다. 지울 때는 그 화면 아래의 '이 글 삭제'를 누릅니다.
- 수상작 갤러리와 작가 갤러리의 제목은 `상훈_이름` 형식으로 씁니다. 예: `은상_김현희`. 홈페이지에는 이름과 상훈이 따로 보입니다.

### 사진 넣기

- 본문 칸의 '사진 넣기'를 누르고 사진을 고르면, 본문에 `![사진 설명](/uploads/….webp)` 한 줄이 들어갑니다.
- `사진 설명` 부분은 사진 내용으로 바꿔 주세요. 예: `![2025 정기 회원전 개막식 단체 사진](...)`. 화면을 읽어 주는 프로그램이 이 글을 읽어 줍니다.
- 그 줄을 지우면 사진도 빠집니다. 줄을 옮기면 사진 위치가 바뀝니다.
- JPG, PNG, WebP, GIF 사진을 한 장에 20MB까지 올릴 수 있습니다. 큰 사진은 자동으로 줄어듭니다.

### 본문 쓰는 법

| 이렇게 쓰면                        | 이렇게 보입니다        |
| ---------------------------------- | ---------------------- |
| `## 소제목`                        | 큰 소제목              |
| `### 작은 제목`                    | 작은 제목              |
| `- 항목` (한 줄에 하나씩)          | 점 목록                |
| `**중요한 말**`                    | 굵은 글씨              |
| `[신청서 쓰기](/application-form)` | 누르면 이동하는 링크   |
| `https://…` 주소 그대로            | 자동으로 링크가 됩니다 |
| 빈 줄                              | 새 문단                |

HTML 태그는 동작하지 않고 글자 그대로 보입니다.

### 대표 이미지, 첨부파일, 상단 고정

- **대표 이미지**: 사진 게시판(협회활동, 지부·교육기관, 정기 회원전)과 갤러리(수상작 갤러리, 작가 갤러리) 글에만 있습니다. 목록 카드, 첫 화면, 카카오톡 공유 미리보기에 쓰이는 사진입니다. 보통은 '본문 첫 사진'을 그대로 두면 됩니다. 다른 본문 사진을 고르거나 '새 사진 올리기'로 따로 올릴 수도 있습니다.
- **첨부파일**: PDF, 한글(HWP·HWPX), 워드·엑셀·파워포인트, ZIP, 사진 파일을 한 개에 20MB까지 올릴 수 있습니다. 한 번 저장할 때 올리는 파일은 모두 합쳐 40MB까지입니다. 더 많으면 나누어 저장하세요.
- **상단 고정**: '목록 맨 위에 고정합니다'에 체크하면 그 글이 게시판 맨 위에 계속 보입니다. 중요한 공지에만 쓰세요.

### 페이지, 공모전 안내, 팝업

- **페이지 수정**: 조직도, 이용약관, 개인정보처리방침은 관리자 메뉴의 '페이지'에서 고칩니다. 쓰는 법은 본문과 같습니다.
- **공모전 안내**: '사이트 설정'에서 첫 화면의 공모전 안내(상태, 공모전 이름, 접수 기간, 안내 문구, 연결할 글 주소)를 바꿉니다.
- **팝업**: '사이트 설정'에서 첫 화면 팝업을 켜고 끕니다. 팝업 사진, 사진 설명, 누르면 이동할 주소, 마지막으로 보일 날짜를 넣습니다. 날짜를 비우면 끌 때까지 계속 보입니다.

### 신청서

- 홈페이지 '시험 접수 신청서'로 들어온 신청은 관리자 메뉴의 '시험 접수 신청서'에서 봅니다. 대시보드에도 받은 신청서 수가 보입니다. 첨부파일은 관리자만 내려받을 수 있습니다.
- 확인을 마친 신청서는 지워도 됩니다. 신청서 화면에서 '신청서 삭제'를 누르고 '삭제합니다'를 한 번 더 누릅니다.
- 개인정보 보호를 위해 **신청일로부터 1년이 지난 신청서와 첨부파일은 자동으로 삭제됩니다.** 오래 보관할 내용은 미리 따로 옮겨 두세요.

## 배포

`main`에 올리면 GitHub Actions(`.github/workflows/ci-cd.yml`)가 다음을 차례로 합니다.

1. 검사: 타입 검사, `npm test`, 빌드
2. 이미지: `ghcr.io/<저장소>:<커밋>`으로 올리기
3. 배포: 서버의 `/home/sjw/kcca`에 `compose.production.yml`과 `deploy.sh`를 복사하고 `deploy.sh`를 실행

`deploy.sh`는 `.env`가 있는지 확인하고, 서버에 없는 이미지면 받은 뒤 `ADMIN_PASSWORD`가 12자 이상인지, `SITE_URL`이 `https://` 주소인지 확인합니다. 그다음 컨테이너를 바꾸고 헬스체크(첫 화면 응답과 `/data` 쓰기 권한 확인)가 통과할 때까지 기다립니다. 실패하면 이전 이미지로 되돌립니다. 성공하면 지금 이미지와 바로 이전 이미지만 남기고 예전 이미지를 지웁니다. 데이터 볼륨은 지우지 않습니다. GitHub 저장소에는 `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` 시크릿이 필요합니다.

### 서버 준비 (처음 한 번)

```sh
cd /home/sjw/kcca
cat > .env <<'EOF'
ADMIN_PASSWORD=여기에-16자-이상-비밀번호
SITE_URL=https://kcca.hohyeon.dev
ALLOW_INDEXING=false
EOF
chmod 600 .env
```

- `.env`는 git에 올리지 않고 서버에만 둡니다. `DATA_DIR`은 Compose가 `/data`로 고정하므로 적지 않습니다.
- 앱은 `127.0.0.1:8082`에서만 받습니다. 호스트 nginx 설정은 `deploy/host-nginx.example.conf`를 참고하세요.
- `.env`를 고친 뒤에는 컨테이너를 다시 만들어야 적용됩니다. `docker restart`로는 바뀌지 않습니다.

```sh
cd /home/sjw/kcca
KCCA_IMAGE_REF="$(docker inspect --format '{{.Config.Image}}' kcca)" ./deploy.sh
```

### 데이터와 백업

DB와 업로드 파일은 Docker 볼륨 `kcca_kcca-data`에 있습니다. 이 이름은 Compose 프로젝트 `kcca`와 볼륨 `kcca-data`를 합친 것입니다. 재배포해도 볼륨은 그대로 남습니다. `docker compose down -v`나 `docker volume rm`은 쓰지 마세요.

```sh
# 백업: 컨테이너를 잠깐 멈추고 현재 폴더에 kcca-data-날짜.tgz 생성
docker stop kcca
docker run --rm -v kcca_kcca-data:/data:ro -v "$PWD":/backup alpine \
  tar czf /backup/kcca-data-$(date +%F).tgz -C /data .
docker start kcca

# 복원: 컨테이너를 멈추고 볼륨 내용을 백업으로 바꾼 뒤 다시 시작
docker stop kcca
docker run --rm -v kcca_kcca-data:/data -v "$PWD":/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/kcca-data-2026-10-01.tgz -C /data'
docker start kcca
```

- 백업은 꼭 컨테이너를 멈춘 상태에서 합니다. DB는 글을 볼 때마다(조회수) 바뀌므로 실행 중에 복사하면 백업이 깨질 수 있습니다. 백업하는 동안(보통 1분 안) 사이트가 열리지 않으니 방문자가 적은 시간에 하세요.
- 백업 파일에는 신청서(개인정보)도 들어 있습니다. 1년이 지난 백업은 지워 주세요.

### 운영 서버에서 imweb 가져오기

실행 중인 컨테이너 안에서 실행합니다. 결과는 바로 사이트에 반영됩니다.

```sh
docker exec kcca node --no-warnings scripts/import-imweb.ts --dry-run   # 미리보기, 저장 안 함
docker exec kcca node --no-warnings scripts/import-imweb.ts
```

`--no-warnings`를 빼면 Node가 package.json에 `"type": "module"`을 넣으라는 경고를 보여 줍니다. 넣지 마세요. 넣으면 서버(`server.js`)가 시작되지 않습니다.

컨테이너가 떠 있지 않다면 서버의 `/home/sjw/kcca`에서 다음처럼 실행합니다.

```sh
KCCA_IMAGE_REF=ghcr.io/<저장소>:<커밋> docker compose --project-name kcca -f compose.production.yml run --rm web node --no-warnings scripts/import-imweb.ts
```

## imweb에서 새 서버로 전환하기

1. 미리보기 주소(https://kcca.hohyeon.dev)에서 관리자 로그인, 글쓰기, 사진 넣기, 신청서 접수를 확인합니다.
2. DNS의 TTL을 미리 300초 정도로 낮춰 둡니다.
3. 전환하는 날에는 imweb에 새 글을 올리지 않습니다.
4. imweb 관리자에서 신청서(폼) 접수 내역을 내려받아 따로 보관합니다. 이 내역은 가져오기로 옮겨지지 않습니다.
5. 전환 직전에 가져오기를 다시 실행해 새 글과 조회수를 옮깁니다: `docker exec kcca node --no-warnings scripts/import-imweb.ts --update-views`
   - 이미 옮긴 글은 건너뛰고, 관리자에서 지운 글도 다시 가져오지 않습니다. 새 서버에서 고친 내용은 그대로 남습니다.
   - DNS를 이미 바꾼 뒤라면 `IMWEB_URL`에 imweb 기본 도메인(imweb 관리자 → 도메인)을 넣고 실행합니다: `docker exec -e IMWEB_URL=https://… kcca node --no-warnings scripts/import-imweb.ts`
6. 호스트 nginx에 `kcca-society.kr`, `www.kcca-society.kr` 설정을 추가하고 인증서를 발급합니다(`deploy/host-nginx.example.conf`). 필수 설정은 다음과 같습니다.
   - `client_max_body_size`: 기본 `1m`, `/admin`은 `50m`, `/application-form`은 `25m` (예시 파일처럼 경로별로)
   - `proxy_set_header Host $host`
   - `proxy_set_header X-Forwarded-Host $host`
   - `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`
   - `proxy_set_header X-Forwarded-Proto $scheme`
   - `add_header Strict-Transport-Security "max-age=31536000" always`
   - `proxy_buffering off` (선택)
7. 서버 `.env`를 `SITE_URL=https://kcca-society.kr`, `ALLOW_INDEXING=true`로 바꾸고 컨테이너를 다시 만듭니다(위 '서버 준비'의 `deploy.sh` 명령).
8. 도메인 관리 업체에서 `kcca-society.kr`, `www` A 레코드를 새 서버 IP로 바꿉니다. 도메인이 imweb에 연결되어 있었다면 imweb의 도메인 연결도 해제합니다.
9. 전환 뒤에 확인합니다.
   - `https://kcca-society.kr`가 열리는지
   - 아래의 옛 주소가 새 주소로 넘어가는지
   - `/robots.txt`가 수집을 허용하고 `/sitemap.xml`에 글이 보이는지
10. 네이버 서치어드바이저와 Google Search Console에 사이트맵(`/sitemap.xml`)을 등록합니다. 카카오톡 미리보기가 예전 모습이면 카카오 공유 디버거에서 캐시를 지웁니다.
11. `.github/workflows/ci-cd.yml`의 `environment.url`을 `https://kcca-society.kr`로 바꿉니다.

### 자동으로 넘어가는 옛 imweb 주소

| 옛 주소                                        | 새 주소                                                        |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `/<게시판>/?idx=<번호>&bmode=view` (게시글)    | `/<게시판>/<번호>` (가져온 글은 imweb 글 번호를 그대로 씁니다) |
| `/about`                                       | `/about-history`                                               |
| `/Class`                                       | `/notice-association`                                          |
| `/27`                                          | `/notice-membership`                                           |
| `/43`                                          | `/notice-contest`                                              |
| `/certificate`                                 | `/certificate-guide`                                           |
| `/application-form-1`                          | `/application-form`                                            |
| `/25` (지부교육기관)                           | `/branches`                                                    |
| `/notice-gallery-2025`, `/notice-gallery-2024` | `/notice-gallery?category=<해당 공모전>`                       |
| `/?mode=policy`, `/?mode=privacy`              | `/policy`, `/privacy`                                          |
| `/54`, `/59`, `/60`, `/61` (쇼핑)              | `/`                                                            |

협회소개(`/about-history`, `/about-greetings`, `/about-organization`, `/about-map`), 자격증 안내(`/certificate-guide`, `/certificate-guide-1`~`6`), `/application-form`, 각 게시판 주소는 imweb과 같습니다. 쇼핑 페이지 `/62`, `/64`, `/shop_view/...`는 없어져 404 페이지가 나옵니다.
