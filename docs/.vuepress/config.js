module.exports = {
  base: '/rust_camp_tutorial/',
  title: 'Rust训练营教程文档',
  description: 'DragonOS-Rust camp',
  head: [           // 注入到当前页面的 HTML <head> 中的标签
      [
        'link', 
        { 
          rel: 'icon',
          href: '/logo.png' 
        }
      ], 
      // 自定义的网页标签图标
    ],
  themeConfig: {
    logo: '\logo.png',
    nav: [                // 导航栏配置
		  {
			  text: '首页', link: '/'
		  },
	  ],

    sidebar: 'auto',    // 侧边栏配置


  }
}
