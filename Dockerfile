FROM --platform=linux/amd64 node:20-alpine AS ui
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM --platform=linux/amd64 gradle:8.7-jdk21 AS bff
WORKDIR /workspace
COPY bff/settings.gradle.kts bff/build.gradle.kts ./
COPY bff/src ./src
RUN gradle bootJar --no-daemon -x test

FROM --platform=linux/amd64 eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=bff /workspace/build/libs/politech2-bff.jar /app/app.jar
COPY --from=ui /app/dist/politech2/browser /app/static
ENV PORT=8088
ENV POLITECH_API_URL=http://host.docker.internal:8080
EXPOSE 8088
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
