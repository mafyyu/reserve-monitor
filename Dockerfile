FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app
ENV TZ=Asia/Tokyo

COPY package*.json ./
RUN npm ci
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium

COPY . .

RUN chmod +x /app/docker/start.sh
RUN npx playwright --version

EXPOSE 3001

CMD ["/app/docker/start.sh"]
