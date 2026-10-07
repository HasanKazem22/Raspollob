# ---- Build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Dependencies first, so they're cached until pom.xml changes
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline

COPY src src
RUN ./mvnw -q -B package -DskipTests

# ---- Run ----
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --uid 1001 app \
    && mkdir -p /app/uploads \
    && chown app /app/uploads

COPY --from=build /app/target/*.jar app.jar

USER app
ENV UPLOAD_DIR=/app/uploads \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=Asia/Dhaka"
EXPOSE 8085

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
