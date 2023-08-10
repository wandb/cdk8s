
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /cdk8s
WORKDIR /cdk8s

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run compile

FROM base
COPY --from=prod-deps /cdk8s/node_modules /cdk8s/node_modules
COPY --from=build /cdk8s/bin /cdk8s/bin
COPY --from=build /cdk8s/package.json /cdk8s/package.json

CMD [ "pnpm", "start" ]
