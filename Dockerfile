FROM denoland/deno:alpine
WORKDIR /app
COPY . .
CMD ["run", "--allow-all", "bot.ts"]
