#!/usr/bin/env bash
set -Eeuo pipefail

: "${HOHYEON_IMAGE_REF:?HOHYEON_IMAGE_REF is required}"

readonly compose_file="compose.production.yml"
readonly container_name="hohyeon-dev"
readonly startup_timeout_seconds=120

compose=(docker compose --project-name hohyeon-dev --file "$compose_file")

previous_image="$(docker inspect --format '{{.Config.Image}}' "$container_name" 2>/dev/null || true)"
previous_project="$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project"}}' "$container_name" 2>/dev/null || true)"

wait_until_running() {
  local elapsed=0
  local status=""

  while (( elapsed < startup_timeout_seconds )); do
    status="$(docker inspect --format '{{.State.Status}}' "$container_name" 2>/dev/null || true)"

    case "$status" in
      running)
        return 0
        ;;
      exited|dead)
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

  HOHYEON_IMAGE_REF="$previous_image" \
    "${compose[@]}" up --detach --no-deps --force-recreate web

  if ! wait_until_running; then
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

test -f ".env.production" || {
  echo ".env.production 파일이 없습니다." >&2
  exit 1
}

echo "배포 이미지를 받습니다: $HOHYEON_IMAGE_REF"
"${compose[@]}" pull web

# 기존 Compose 프로젝트의 컨테이너를 새 배포 구성으로 전환
if [[ -n "$previous_image" && "$previous_project" != "hohyeon" ]]; then
  echo "기존 Compose 프로젝트의 웹 컨테이너를 새 배포 구성으로 전환합니다."
  docker rm --force "$container_name"
fi

if ! "${compose[@]}" up --detach --no-deps --force-recreate web; then
  rollback
  exit 1
fi

if ! wait_until_running; then
  rollback
  exit 1
fi

echo "배포가 완료됐습니다: $HOHYEON_IMAGE_REF"

docker image prune --force >/dev/null