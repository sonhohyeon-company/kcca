#!/usr/bin/env bash
set -Eeuo pipefail

: "${KCCA_IMAGE_REF:?KCCA_IMAGE_REF is required}"

readonly compose_file="compose.production.yml"
readonly container_name="kcca"
readonly startup_timeout_seconds=120

# 데이터 볼륨(kcca_kcca-data)은 절대 지우지 않습니다: `down -v`, `volume rm` 금지.
compose=(docker compose --project-name kcca --file "$compose_file")

previous_image="$(docker inspect --format '{{.Config.Image}}' "$container_name" 2>/dev/null || true)"
previous_project="$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$container_name" 2>/dev/null || true)"

# 헬스체크가 있는 이미지는 healthy, 없는 이미지(이전 버전)는 running이면 성공
wait_until_ready() {
  local elapsed=0
  local status=""

  while (( elapsed < startup_timeout_seconds )); do
    status="$(docker inspect --format '{{.State.Status}}/{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container_name" 2>/dev/null || true)"

    case "$status" in
      running/healthy|running/)
        return 0
        ;;
      exited/*|dead/*|*/unhealthy)
        return 1
        ;;
    esac

    sleep 3
    elapsed=$((elapsed + 3))
  done

  return 1
}

rollback() {
  echo "새 버전이 정상적으로 실행되지 않아 이전 이미지로 복구합니다." >&2
  docker logs --tail 100 "$container_name" >&2 2>/dev/null || true

  if [[ -z "$previous_image" ]]; then
    "${compose[@]}" down --remove-orphans || true
    return 1
  fi

  KCCA_IMAGE_REF="$previous_image" \
    "${compose[@]}" up --detach --no-deps --force-recreate web

  if ! wait_until_ready; then
    echo "이전 이미지 복구 후에도 컨테이너가 실행되지 않았습니다." >&2
    docker logs --tail 100 "$container_name" >&2 2>/dev/null || true
    return 1
  fi

  echo "이전 이미지로 복구했습니다: $previous_image"
}

test -f "$compose_file" || {
  echo "$compose_file 파일이 없습니다." >&2
  exit 1
}

test -f .env || {
  echo "$PWD/.env 파일이 없습니다. ADMIN_PASSWORD, SITE_URL, ALLOW_INDEXING을 적어 만든 뒤 다시 배포하세요 (README의 '배포' 참고)." >&2
  exit 1
}

# 이미지 태그는 커밋별로 바뀌지 않으므로 서버에 이미 있으면 받지 않습니다 (.env만 바꾼 재배포는 GHCR 로그인 불필요).
if ! docker image inspect "$KCCA_IMAGE_REF" >/dev/null 2>&1; then
  echo "배포 이미지를 받습니다: $KCCA_IMAGE_REF"
  "${compose[@]}" pull web
fi

# 앱이 실제로 받는 값으로 확인합니다 (.env의 따옴표·주석 처리까지 Compose와 동일).
if ! "${compose[@]}" run --rm --no-deps -T web node -e '
  const env = process.env;
  const fail = (message) => { console.error(message); process.exit(1); };
  if ((env.ADMIN_PASSWORD ?? "").length < 12)
    fail(".env의 ADMIN_PASSWORD가 비어 있거나 12자보다 짧습니다. 이대로는 관리자 로그인이 꺼집니다.");
  if (URL.parse(env.SITE_URL ?? "")?.protocol !== "https:")
    fail(".env의 SITE_URL이 없거나 https:// 주소가 아닙니다. 예: SITE_URL=https://kcca-society.kr");
'; then
  echo "배포를 중단합니다." >&2
  exit 1
fi

# 기존 Compose 프로젝트의 컨테이너를 새 배포 구성으로 전환
if [[ -n "$previous_image" && "$previous_project" != "kcca" ]]; then
  echo "기존 Compose 프로젝트의 웹 컨테이너를 새 배포 구성으로 전환합니다."
  docker rm --force "$container_name"
fi

if ! "${compose[@]}" up --detach --no-deps --force-recreate web; then
  rollback
  exit 1
fi

if ! wait_until_ready; then
  rollback
  exit 1
fi

echo "배포가 완료됐습니다: $KCCA_IMAGE_REF"

# 이 저장소의 예전 이미지는 지금 것과 바로 이전 것(되돌리기용)만 남깁니다.
docker images --format '{{.Repository}}:{{.Tag}}' "${KCCA_IMAGE_REF%:*}" \
  | grep -vxF -e "$KCCA_IMAGE_REF" -e "$previous_image" \
  | xargs -r docker rmi >/dev/null 2>&1 || true
docker image prune --force >/dev/null
