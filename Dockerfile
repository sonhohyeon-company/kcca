FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Linux(musl)용 sharp 바이너리를 여기서 설치합니다.
RUN npm ci
COPY . .
# next/font가 빌드 중에 Google Fonts를 받으므로 네트워크가 필요합니다.
RUN npm run build

# Next.js standalone 서버 (컨테이너 포트 8080). DB와 업로드는 /data 볼륨에 둡니다.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=8080 DATA_DIR=/data
# 앱 코드는 root 소유(읽기 전용). node가 쓰는 곳만 아래 RUN에서 넘깁니다.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# `node --no-warnings scripts/import-imweb.ts`(imweb 가져오기)를 컨테이너 안에서 실행하기 위한 원본
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/lib/schema.ts /app/lib/boards.ts ./lib/
# .next/cache: 이미지 최적화 캐시. .next/server/app: 관리자 저장 뒤 다시 만드는 404 페이지 등.
RUN mkdir -p /data .next/cache && chown -R node:node /data .next/cache .next/server/app
USER node
EXPOSE 8080
# 이미지에 두어야 이 헬스체크가 없는 이전 이미지로 롤백해도 deploy.sh가 '실행 중'으로 판단합니다.
# 첫 화면 응답(레이아웃 메타데이터의 SITE_URL, DB 읽기)과 /data·그 바로 아래 항목의 쓰기 권한을 확인합니다.
# 첫 화면은 DB를 읽기만 하므로, root로 복원한 볼륨처럼 쓰기만 막힌 경우는 권한 검사로 잡습니다.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --start-interval=2s --retries=3 \
  CMD ["node", "-e", "const fs = require('node:fs'); for (const f of ['', ...fs.readdirSync('/data')]) fs.accessSync('/data/' + f, fs.constants.W_OK); fetch('http://127.0.0.1:8080/').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]
