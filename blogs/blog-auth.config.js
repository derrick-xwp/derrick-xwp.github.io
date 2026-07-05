/**
 * 博客访问密码配置（客户端加密方案）。
 *
 * 仓库中仅存放 KDF 盐值与加密后的内容，不存放明文密码。
 *
 * 修改密码后重新加密：
 *   $env:BLOG_PASSWORD="你的新密码"; python encrypt-blogs.py
 *
 * 编辑明文博客：
 *   python encrypt-blogs.py --init   # 首次从当前 HTML 导出到 _plain/
 *   编辑 _plain/ 下文件后运行 encrypt-blogs.py
 *
 * 默认密码：HK2026（上线后请尽快修改并重新加密）
 */
window.BLOG_AUTH_CONFIG = {
  encryption: true,
  kdfSalt: 'xK7mP2nQ9vR4wL8jH5fT1aE6sY0uI3o',
  kdfIterations: 250000,
  canaryEnc: 'blog-auth.canary.enc.json',
  storageKey: 'hk2026-blog-unlock-v1',
  sessionHours: 12,
  title: '技术博客访问验证',
  hint: '请输入博客访问密码以继续阅读。',
};
