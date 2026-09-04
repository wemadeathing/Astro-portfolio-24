# Builds the standalone chat backend (server/). Build context is the REPO
# ROOT, not server/ — the server reads shared/ (zod schemas shared with the
# Astro app) and src/content/ (markdown source for retrieval) directly at
# runtime. See /Users/nasifsalaam/.claude/plans/fizzy-brewing-eagle.md
# §Layout — setting Railway's Root Directory to `server` would exclude both
# and the content loader would boot with an empty catalog.
#
# better-sqlite3 isn't used (Postgres instead), but the build stage still
# needs a C toolchain for other native deps in the tree; kept on Debian
# slim rather than Alpine for prebuilt-binary compatibility.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY server/package*.json ./server/
RUN npm --prefix server ci

COPY shared ./shared
COPY src/content ./src/content
COPY src/pages/about.astro ./src/pages/about.astro
COPY server ./server
RUN npm --prefix server run build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app/server
ENV NODE_ENV=production

COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/drizzle ./drizzle
COPY --from=build /app/shared /app/shared
COPY --from=build /app/src/content /app/src/content
COPY --from=build /app/src/pages/about.astro /app/src/pages/about.astro

EXPOSE 8080
CMD ["node", "dist/index.js"]
