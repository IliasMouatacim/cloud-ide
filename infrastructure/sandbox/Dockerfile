FROM node:20-alpine

# Install language runtimes for sandboxed execution
RUN apk add --no-cache \
    python3 \
    py3-pip \
    gcc \
    g++ \
    bash \
    && rm -rf /var/cache/apk/*

# Create sandbox user with limited permissions
RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

WORKDIR /sandbox

COPY runner.js ./

# Set resource limits via ulimit
USER sandbox

EXPOSE 4000

CMD ["node", "runner.js"]
