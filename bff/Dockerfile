FROM --platform=linux/amd64 gradle:8.7-jdk21 AS build
WORKDIR /workspace
COPY settings.gradle.kts build.gradle.kts ./
COPY src ./src
RUN gradle bootJar --no-daemon -x test

FROM --platform=linux/amd64 eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=build /workspace/build/libs/politech2-bff.jar /app/app.jar
ENV PORT=8088
ENV POLITECH_API_URL=http://host.docker.internal:8080
EXPOSE 8088
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
