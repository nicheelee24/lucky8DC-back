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
            code: "newplayerstatistics",
            label: {
                zh_CN: "新玩家统计",
                en_US: "New Player Statistics",
            },
            icon: "transaction",
            path: "/new-player-statistics",
        },
        {
            code: "playerstats",
            label: {
                zh_CN: "球员统计数据",
                en_US: "Player Stats",
            },
            icon: "transaction",
            path: "/player-stats",
        },
        {
            code: "subagentmanagement",
            label: {
                zh_CN: "权限",
                en_US: "Sub Agents",
            },
            icon: "permission",
            path: "/sub-agent",
            children: [
                {
                    code: "subAgentManage",
                    label: {
                        zh_CN: "路由权限",
                        en_US: "Manage",
                    },
                    path: "/sub-agent/manage",
                },
                // {
                //   code: 'subagent2',
                //   label: {
                //     zh_CN: '404',
                //     en_US: '404',
                //   },
                //   path: '/sub-agent/404',
                // },
            ],
        },
        {
            code: "report",
            label: {
                zh_CN: "权限",
                en_US: "Report",
            },
            icon: "permission",
            path: "/report",
            children: [
                {
                    code: "win-loss-reports",
                    label: {
                        zh_CN: "赢/输报告",
                        en_US: "Win/Loss Reports",
                    },
                    path: "/report/win-loss",
                },
            ],
        },
        {
            code: "history",
            label: {
                zh_CN: "历史",
                en_US: "History",
            },
            icon: "permission",
            path: "/history",
            children: [
                {
                    code: "history-bets",
                    label: {
                        zh_CN: "投注历史",
                        en_US: "Bets History",
                    },
                    path: "/history/bets",
                },
            ],
        },
        {
            code: "member",
            label: {
                zh_CN: "成员",
                en_US: "Member",
            },
            icon: "permission",
            path: "/member",
            children: [
                {
                    code: "member-management",
                    label: {
                        zh_CN: "会员管理",
                        en_US: "Member Mangement",
                    },
                    path: "/member/management",
                },
            ],
        },

        // {
        //     code: "account",
        //     label: {
        //         zh_CN: "Account",
        //         en_US: "Account",
        //     },
        //     icon: "permission",
        //     path: "/permission",
        //     children: [
        //         {
        //             code: "account1",
        //             label: {
        //                 zh_CN: "路由权限",
        //                 en_US: "Route Permission",
        //             },
        //             path: "/account/account1",
        //         },
        //         {
        //             code: "account2",
        //             label: {
        //                 zh_CN: "404",
        //                 en_US: "404",
        //             },
        //             path: "/account/account2",
        //         },
        //     ],
        // },

        // {
        //     code: "playermanagement",
        //     label: {
        //         zh_CN: "权限",
        //         en_US: "Players",
        //     },
        //     icon: "permission",
        //     path: "/permission",
        //     children: [
        //         {
        //             code: "playermanagement1",
        //             label: {
        //                 zh_CN: "路由权限",
        //                 en_US: "Players Mangement1",
        //             },
        //             path: "/permission/route",
        //         },
        //         {
        //             code: "playermanagement2",
        //             label: {
        //                 zh_CN: "404",
        //                 en_US: "404",
        //             },
        //             path: "/permission/404",
        //         },
        //     ],
        // },
        // {
        //     code: "transaction",
        //     label: {
        //         zh_CN: "文档",
        //         en_US: "Tranaction",
        //     },
        //     icon: "transaction",
        //     path: "/documentation",
        // },

        // {
        //     code: "setting",
        //     label: {
        //         zh_CN: "文档",
        //         en_US: "Setting",
        //     },
        //     icon: "setting",
        //     path: "/setting",
        // },
        // {
        //     code: "dashboard",
        //     label: {
        //         zh_CN: "首页",
        //         en_US: "Dashboard",
        //     },
        //     icon: "dashboard",
        //     path: "/dashboard",
        // },
        // {
        //     code: "documentation",
        //     label: {
        //         zh_CN: "文档",
        //         en_US: "Documentation",
        //     },
        //     icon: "documentation",
        //     path: "/documentation",
        // },
        // {
        //     code: "guide",
        //     label: {
        //         zh_CN: "引导",
        //         en_US: "Guide",
        //     },
        //     icon: "guide",
        //     path: "/guide",
        // },
        // {
        //     code: "permission",
        //     label: {
        //         zh_CN: "权限",
        //         en_US: "Permission",
        //     },
        //     icon: "permission",
        //     path: "/permission",
        //     children: [
        //         {
        //             code: "routePermission",
        //             label: {
        //                 zh_CN: "路由权限",
        //                 en_US: "Route Permission",
        //             },
        //             path: "/permission/route",
        //         },
        //         {
        //             code: "notFound",
        //             label: {
        //                 zh_CN: "404",
        //                 en_US: "404",
        //             },
        //             path: "/permission/404",
        //         },
        //     ],
        // },
        // {
        //     code: "component",
        //     label: {
        //         zh_CN: "组件",
        //         en_US: "Component",
        //     },
        //     icon: "permission",
        //     path: "/component",
        //     children: [
        //         {
        //             code: "componentForm",
        //             label: {
        //                 zh_CN: "表单",
        //                 en_US: "Form",
        //             },
        //             path: "/component/form",
        //         },
        //         {
        //             code: "componentTable",
        //             label: {
        //                 zh_CN: "表格",
        //                 en_US: "Table",
        //             },
        //             path: "/component/table",
        //         },
        //         {
        //             code: "componentSearch",
        //             label: {
        //                 zh_CN: "查询",
        //                 en_US: "Search",
        //             },
        //             path: "/component/search",
        //         },
        //         {
        //             code: "componentAside",
        //             label: {
        //                 zh_CN: "侧边栏",
        //                 en_US: "Aside",
        //             },
        //             path: "/component/aside",
        //         },
        //         {
        //             code: "componentTabs",
        //             label: {
        //                 zh_CN: "选项卡",
        //                 en_US: "Tabs",
        //             },
        //             path: "/component/tabs",
        //         },
        //         {
        //             code: "componentRadioCards",
        //             label: {
        //                 zh_CN: "单选卡片",
        //                 en_US: "Radio Cards",
        //             },
        //             path: "/component/radio-cards",
        //         },
        //     ],
        // },

        // {
        //     code: "business",
        //     label: {
        //         zh_CN: "业务",
        //         en_US: "Business",
        //     },
        //     icon: "permission",
        //     path: "/business",
        //     children: [
        //         {
        //             code: "basic",
        //             label: {
        //                 zh_CN: "基本",
        //                 en_US: "Basic",
        //             },
        //             path: "/business/basic",
        //         },
        //         {
        //             code: "withSearch",
        //             label: {
        //                 zh_CN: "带查询",
        //                 en_US: "WithSearch",
        //             },
        //             path: "/business/with-search",
        //         },
        //         {
        //             code: "withAside",
        //             label: {
        //                 zh_CN: "带侧边栏",
        //                 en_US: "WithAside",
        //             },
        //             path: "/business/with-aside",
        //         },
        //         {
        //             code: "withRadioCard",
        //             label: {
        //                 zh_CN: "带单选卡片",
        //                 en_US: "With Nav Tabs",
        //             },
        //             path: "/business/with-radio-cards",
        //         },
        //         {
        //             code: "withTabs",
        //             label: {
        //                 zh_CN: "带选项卡",
        //                 en_US: "With Tabs",
        //             },
        //             path: "/business/with-tabs",
        //         },
        //     ],
        // },
    ];

    res.json({ status: true, result: mockMenuList });
});

module.exports = router;
