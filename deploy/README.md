# SZA POWER 生产部署清单

这份目录只提供可审计的部署模板，域名、证书、密钥和服务器账号必须由运维人员在目标服务器上填写，不能提交到代码仓库。

## 1. 应用与密钥

1. 在服务器创建独立的 `sza-power` 系统用户和应用目录，禁止用 root 运行 Node。
2. 使用 Node.js LTS，执行 `npm ci`、`npm run build`，再用 systemd 或进程管理器运行 `npm run start`。
3. 复制 `.env.example` 为生产环境变量文件，至少设置 `SZA_SESSION_SECRET`、`SZA_ADMIN_PASSWORD`、`SZA_TRUSTED_ORIGINS`、`NEXT_PUBLIC_SITE_URL` 和 `SZA_SQLITE_PATH`。密码和会话密钥使用密码管理器保存并定期轮换。
4. `data/` 和 `data/backups/` 只允许应用用户读写；备份目录禁止被 Nginx 直接映射。

## 2. HTTPS 与反向代理

将 `nginx-site.conf` 中的域名和证书路径替换为真实值，并把 `proxy_params` 安装到 `/etc/nginx/proxy_params`（或改成服务器上的实际路径）。先执行 `nginx -t`，通过后再 reload。HTTP 会自动跳转 HTTPS，TLS 仅启用 1.2/1.3，并已配置 API 限流、隐藏版本号和大文件上传转发。

证书可以使用 Certbot 自动续期；续期后执行 `systemctl reload nginx`。DNS、云安全组和防火墙只开放 80/443，SSH 仅开放给固定管理网段。

## 3. 备份与恢复

应用会在访问流量触发时按系统设置创建 SQLite 自动备份，也支持后台手动备份和下载。生产环境仍应添加服务器级定时任务（例如每天执行一次 `sqlite3 "$SZA_SQLITE_PATH" ".backup '$BACKUP_FILE'"`），并把备份同步到独立、加密、异地的对象存储；至少保留一份离线副本。每月抽样恢复一次，确认备份可用。

## 4. 监控与日志

使用反向代理访问日志、`/api/health` 健康检查和后台“系统设置”中的访问日志/安全事件。建议用 systemd watchdog、Uptime Kuma 或云监控每分钟检查 `/api/health`，并对 5xx、登录锁定、CSRF 拒绝、上传失败和磁盘空间不足设置告警。日志应限制保留周期，避免记录密码、验证码和完整客户隐私数据。

## 5. 发布前检查

- `npm run lint` 和 `npm run build` 必须通过。
- 生产环境首次启动前确认管理员密码已配置；不要使用开发默认密码。
- 从公网检查 HTTPS、HSTS、CSP、`X-Content-Type-Options` 和 `X-Frame-Options`。
- 用真实域名验证中英文页面、产品详情、询价提交、后台登录、验证码、角色权限、备份下载和移动端布局。
- 定期更新 Node、Next.js、依赖包和操作系统安全补丁，并在 CI 中运行依赖审计。