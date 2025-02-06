const express = require("express");
const router = express.Router();

router.get("/menu", async (req, res) => {
    const mockMenuList = [
        {
            code: "dashboard",
            label: {
                zh_CN: "首页",
                en_US: "Dashboard",
            },
            icon: "dashboard",
            path: "/dashboard",
        },
        {
            code: "account",
            label: {
                zh_CN: "Account",
                en_US: "Account",
            },
            icon: "permission",
            path: "/permission",
            children: [
                {
                    code: "account1",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Route Permission",
                    },
                    path: "/account/account1",
                },
                {
                    code: "account2",
                    label: {
                        zh_CN: "404",
                        en_US: "404",
                    },
                    path: "/account/account2",
                },
            ],
        },

        {
            code: "subagentmanagement",
            label: {
                zh_CN: "权限",
                en_US: "Sub Agents",
            },
            icon: "permission",
            path: "/permission",
            children: [
                {
                    code: "subagent1",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Route Permission",
                    },
                    path: "/permission/route",
                },
                {
                    code: "subagent2",
                    label: {
                        zh_CN: "404",
                        en_US: "404",
                    },
                    path: "/permission/404",
                },
            ],
        },
        {
            code: "report",
            label: {
                zh_CN: "权限",
                en_US: "Report",
            },
            icon: "permission",
            path: "/permission",
            children: [
                {
                    code: "report1",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Route Permission",
                    },
                    path: "/permission/route",
                },
                {
                    code: "report2",
                    label: {
                        zh_CN: "404",
                        en_US: "404",
                    },
                    path: "/permission/404",
                },
            ],
        },
        {
            code: "playermanagement",
            label: {
                zh_CN: "权限",
                en_US: "Players",
            },
            icon: "permission",
            path: "/permission",
            children: [
                {
                    code: "playermanagement1",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Players Mangement1",
                    },
                    path: "/permission/route",
                },
                {
                    code: "playermanagement2",
                    label: {
                        zh_CN: "404",
                        en_US: "404",
                    },
                    path: "/permission/404",
                },
            ],
        },
        {
            code: "transaction",
            label: {
                zh_CN: "文档",
                en_US: "Tranaction",
            },
            icon: "transaction",
            path: "/documentation",
        },

        {
            code: "setting",
            label: {
                zh_CN: "文档",
                en_US: "Setting",
            },
            icon: "setting",
            path: "/setting",
        },

        {
            code: "dashboard",
            label: {
                zh_CN: "首页",
                en_US: "Dashboard",
            },
            icon: "dashboard",
            path: "/dashboard",
        },
        {
            code: "documentation",
            label: {
                zh_CN: "文档",
                en_US: "Documentation",
            },
            icon: "documentation",
            path: "/documentation",
        },
        {
            code: "guide",
            label: {
                zh_CN: "引导",
                en_US: "Guide",
            },
            icon: "guide",
            path: "/guide",
        },
        {
            code: "permission",
            label: {
                zh_CN: "权限",
                en_US: "Permission",
            },
            icon: "permission",
            path: "/permission",
            children: [
                {
                    code: "routePermission",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Route Permission",
                    },
                    path: "/permission/route",
                },
                {
                    code: "notFound",
                    label: {
                        zh_CN: "404",
                        en_US: "404",
                    },
                    path: "/permission/404",
                },
            ],
        },
        {
            code: "component",
            label: {
                zh_CN: "组件",
                en_US: "Component",
            },
            icon: "permission",
            path: "/component",
            children: [
                {
                    code: "componentForm",
                    label: {
                        zh_CN: "表单",
                        en_US: "Form",
                    },
                    path: "/component/form",
                },
                {
                    code: "componentTable",
                    label: {
                        zh_CN: "表格",
                        en_US: "Table",
                    },
                    path: "/component/table",
                },
                {
                    code: "componentSearch",
                    label: {
                        zh_CN: "查询",
                        en_US: "Search",
                    },
                    path: "/component/search",
                },
                {
                    code: "componentAside",
                    label: {
                        zh_CN: "侧边栏",
                        en_US: "Aside",
                    },
                    path: "/component/aside",
                },
                {
                    code: "componentTabs",
                    label: {
                        zh_CN: "选项卡",
                        en_US: "Tabs",
                    },
                    path: "/component/tabs",
                },
                {
                    code: "componentRadioCards",
                    label: {
                        zh_CN: "单选卡片",
                        en_US: "Radio Cards",
                    },
                    path: "/component/radio-cards",
                },
            ],
        },

        {
            code: "business",
            label: {
                zh_CN: "业务",
                en_US: "Business",
            },
            icon: "permission",
            path: "/business",
            children: [
                {
                    code: "basic",
                    label: {
                        zh_CN: "基本",
                        en_US: "Basic",
                    },
                    path: "/business/basic",
                },
                {
                    code: "withSearch",
                    label: {
                        zh_CN: "带查询",
                        en_US: "WithSearch",
                    },
                    path: "/business/with-search",
                },
                {
                    code: "withAside",
                    label: {
                        zh_CN: "带侧边栏",
                        en_US: "WithAside",
                    },
                    path: "/business/with-aside",
                },
                {
                    code: "withRadioCard",
                    label: {
                        zh_CN: "带单选卡片",
                        en_US: "With Nav Tabs",
                    },
                    path: "/business/with-radio-cards",
                },
                {
                    code: "withTabs",
                    label: {
                        zh_CN: "带选项卡",
                        en_US: "With Tabs",
                    },
                    path: "/business/with-tabs",
                },
            ],
        },
    ];

    res.json(mockMenuList);
});

module.exports = router;
