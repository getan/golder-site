// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 站点地址是唯一需要修改的"域名配置"：
// 将来换自有域名（如 golder.sh）只需改这里 + Cloudflare 后台绑定自定义域。
export default defineConfig({
  site: 'https://golder-cli.pages.dev',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
