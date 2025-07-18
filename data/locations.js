/**
 * @file data/locations.js
 * @description 游戏内容 - 地图与地点 (v43.0.0 - [内容] 添加textAlign自定义范例)
 */
window.gameData.maps = {
    "hangcheng": {
        name: "杭城地图",
        nodes: {
            "map_node_home":      { name: "家",      icon: gameData.icons.home, x: 25, y: 20, interaction: { type: 'interactive_dialogue', payload: {
                title: '家',
                options: [
                    { text: '进入小区', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_community' } } } ] },
                    { text: '留在地图上', actionBlock: [] }
                ]
            }}},
            "map_node_downtown":  { name: "市中心",  icon: gameData.icons.work, x: 50, y: 45, interaction: { type: 'interactive_dialogue', payload: {
                title: '市中心广场',
                textAlign: 'center',
                options: [
                    { text: '进入广场 (消耗1时间段)', actionBlock: [
                        { action: { type: 'advanceTime', payload: { phases: 1 } } },
                        { action: { type: 'enter_location', payload: { locationId: 'location_downtown' } } }
                    ]},
                     { text: `[作弊] ${gameData.icons.cheat} 属性+1`, conditions: [{ type: 'flag', flagId: 'cheat_unlocked', value: true }], actionBlock: [
                        { action: { type: 'effect', payload: { stats: { str: 1, dex: 1, int: 1, con: 1, lck: 1 } } } },
                        { action: { type: 'log', payload: { text: '一道光芒闪过，你感觉自己变强了！', color: 'var(--skill-color)' } } }
                    ]},
                     { text: '还是算了', actionBlock: [] }
                ]
            }}},
            "map_node_bus_station": { 
                name: "汽车客运站", icon: gameData.icons.bus, x: 75, y: 80,
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '售票员：你要去哪里？',
                    options: [
                        { text: `回老家 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`, actionBlock: [
                            { action: { type: 'log', payload: { text: '你坐上了长途汽车...' } } },
                            { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } },
                            { action: { type: 'map_transition', payload: { targetMapId: "hometown", targetStartNode: "map_node_hometown_station" } } },
                            { action: { type: 'log', payload: { text: '经过一路奔波，你抵达了新的地方。', color: 'var(--primary-color)' } } }
                        ]},
                        { text: '我再想想', actionBlock: [] }
                    ]
                }}
            }
        },
        connections: [ ["map_node_home", "map_node_downtown"], ["map_node_downtown", "map_node_bus_station"] ]
    },
    "hometown": {
        name: "老家地图",
        nodes: {
            "map_node_hometown_station": {
                name: "客运站", icon: gameData.icons.bus, x: 30, y: 70,
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '准备回杭城吗？',
                    options: [
                         { text: `返回杭城 (消耗${gameData.settings.travelTime.bus_long_distance}时间段)`, actionBlock: [
                            { action: { type: 'log', payload: { text: '你坐上了返回杭城的汽车...' } } },
                            { action: { type: 'advanceTime', payload: { phases: gameData.settings.travelTime.bus_long_distance } } },
                            { action: { type: 'map_transition', payload: { targetMapId: "hangcheng", targetStartNode: "map_node_bus_station" } } },
                            { action: { type: 'log', payload: { text: '经过一路奔波，你回到了杭城。', color: 'var(--primary-color)' } } }
                        ]},
                        { text: '在老家再待会儿', actionBlock: [] }
                    ]
                }}
            },
            "map_node_old_home": { name: "老家", icon: gameData.icons.home, x: 60, y: 30, interaction: { type: 'interactive_dialogue', payload: {
                title: '老家的房子',
                options: [
                    { text: '进去看看', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_old_home' } } } ] },
                    { text: '算了', actionBlock: [] }
                ]
            }} },
			"map_node_grandma_home": { name: "姥姥家", icon: '👵', x: 75, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: '姥姥家的房子',
                options: [
                    { text: '进去看看', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_grandma_home' } } } ] },
                    { text: '算了', actionBlock: [] }
                ]
            }} },
            "map_node_market": { name: "菜市场", icon: gameData.icons.market, x: 45, y: 50, 
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '老家菜市场',
                    options: [
                        { 
                            text: '进去逛逛', 
                            conditions: [{ type: 'time', allowedPhases: [0, 1, 2, 3] }],
                            actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_market' } } } ] 
                        },
                        {
                            text: '菜市场已关门 (营业时间 06:00 - 18:00)',
                            conditions: [{ type: 'time', allowedPhases: [4, 5] }],
                            followUp: {
                                dialogueText: "菜市场已经打烊了，明天再来吧。",
                                options: [{text: "好吧"}]
                            }
                        },
                        { text: '算了', actionBlock: [] }
                    ]
                }} 
            },
        },
        connections: [ 
            ["map_node_hometown_station", "map_node_old_home"], 
            ["map_node_old_home", "map_node_grandma_home"],
            ["map_node_old_home", "map_node_market"] 
        ]
    }
};

window.gameData.locations = {
    "start_creation": { name: "命运的十字路口", description: "回忆如潮水般涌来...", imageUrl: null, hotspots: [] },
    "location_home": { name: "你的房间", description: "一个温馨的小房间，是你休憩的港湾。", imageUrl: "images/location_home.png", hotspots: [
            { label: "出门", x: 80, y: 80, interaction: { type: 'interactive_dialogue', payload: { 
                title: '出门',
                options: [
                    { text: '前往小区门口', actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_community' } } } ] },
                    { text: '算了', actionBlock: [] }
                ]
            } } },
            { label: "床", x: 25, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: "你要休息一下吗？",
                options: [
                    { text: "小睡一会儿 (推进1个时间段)", actionBlock: [ { action: { type: 'log', payload: { text: "你躺在床上小睡了一会儿..." } } }, { action: { type: 'advanceTime', payload: { phases: 1 } } }, { action: { type: 'effect', payload: { mp: 50, hp: 10 } } } ] },
                    { text: "睡到第二天早上", actionBlock: [ { action: { type: 'log', payload: { text: "你决定好好睡一觉，迎接新的一天。" } } }, { action: { type: 'advanceTime', payload: { until: 'next_morning' } } }, { action: { type: 'action', payload: { id: 'fullHeal' } } } ] },
                    { text: "还是算了", actionBlock: [], textAlign: 'right' } // [范例] 自定义右对齐
                ]
            } } },
            { label: "妈妈", x: 60, y: 40, interaction: { type: 'interactive_dialogue', payload: {
                title: '妈妈', 
                imageUrl: 'images/mother.png',
                dialogueText: [
                    '回来了啊，孩子。今天过得怎么样？\n工作不着急找，先玩一段时间。',
                    '找到工作了吗？没找到不用急。\n先吃饭吧。',
                    '你妹又跑出去玩了，一放假就玩得不记得时间。\n可能在市中心逛街。'
                ],
                options: [
                    { text: '“还行，投了几份简历。”', actionBlock: [
                        { action: { type: 'log', payload: { text: '妈妈欣慰地点点头：“不着急，慢慢来，总能找到合适的。”' } } }
                    ]},
                    { text: '“别提了，有点不顺利...”',
                      followUp: {
                          dialogueText: '妈妈拍了拍你的肩膀：“没关系，刚毕业都这样。先吃饭，吃饱了才有力气想别的。”',
                          options: [
                              { text: '“嗯...谢谢妈。”', actionBlock: [ 
                                  { action: { type: 'log', payload: { text: '你感到一阵暖心。' } } },
								  { action: { type: 'effect', payload: { mp: 10 } } } 
                                ] 
                              }
                          ]
                      }
                    },
                    { 
                        text: '“妈，我想回趟老家。”', 
                        conditions: [{ type: 'variable', varId: 'q_visit_grandma', comparison: '!=', value: 1 }],
                        followUp: {
                            dialogueText: '对，正好给你姥姥带两条咸鱼\n她唠叨好久了。',
                            options: [
                                { text: '“好嘞！” (获得咸鱼x2，接取任务)', 
                                  actionBlock: [
                                    { action: { type: 'add_item', payload: { itemId: 'item_salted_fish', quantity: 2 } } },
                                    { action: { type: 'acceptJob', payload: { jobId: 'job_visit_grandma' } } }
                                  ]
                                }
                            ]
                        }
                    },
                    { text: '“妈，我饿了。”', actionBlock: [] }
                ]
            }}},
            { 
                label: "测试战斗", x: 50, y: 20, 
                interaction: { 
                    type: 'combat', 
                    payload: {
                        enemies: [ { id: 'thug', quantity: 2 }, { id: 'thug_leader', quantity: 1 } ],
                        fleeable: false,
                        victoryPrompt: '你干净利落地解决了麻烦！',
                        defeatPrompt: '双拳难敌众手...',
                        victoryActionBlock: [
                            { action: { type: 'set_flag', payload: { flagId: 'defeated_test_thugs', value: true } } },
                            { action: { type: 'effect', payload: { gold: 150 } } },
                            { action: { type: 'add_item', payload: { itemId: 'item_energy_drink', quantity: 1 } } }
                        ],
                        defeatActionBlock: [
                            { action: { type: 'log', payload: { text: '你被狠狠地教训了一顿，混混们搜走了你身上一些财物。', color: 'var(--error-color)' } } },
                            { action: { type: 'effect', payload: { gold: -100 } } },
                            { action: { type: 'remove_item', payload: { itemId: 'item_energy_drink', quantity: 1 } } },
                            { action: { type: 'modify_variable', payload: { varId: 'thug_defeat_count', operation: 'add', value: 1, log: '（你感觉更了解街头生存的残酷了。）', logColor: 'var(--skill-color)' } } }
                        ]
                    } 
                } 
            }
        ] },
    "location_community": { name: "小区门口", description: "熟悉的小区，门口就是公交站。", imageUrl: "images/location_community.png", hotspots: [
            { label: "回家", x: 20, y: 85, interaction: { type: 'interactive_dialogue', payload: {
                title: "回家",
                options: [
                    { text: "返回房间", actionBlock: [ { action: { type: 'enter_location', payload: { locationId: 'location_home' } } } ] },
                    { text: "算了", actionBlock: [] }
                ]
            } } },
            { label: "查看大地图", x: 50, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: '出行方式',
                textAlign: 'center',
                options: [
                    { text: '查看城市地图', actionBlock: [{ action: { type: 'showMap' } }] },
                    { text: '还是算了', actionBlock: [], class: 'secondary-action' }
                ]
            } } }
        ] },
    "location_downtown": { 
        name: "市中心广场", 
        description: "人来人往的市中心广场，杭城的心脏。", 
        imageUrl: "images/location_downtown.png", 
        hotspots: [
            { label: "返回大地图", x: 80, y: 85, interaction: { type: 'interactive_dialogue', payload: {
                title: '返回大地图',
                options: [
                    { text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
                    { text: '算了', actionBlock: [], class: 'secondary-action' }
                ]
            } } },
            { label: "地上的钱包", x: 40, y: 60, interaction: { type: 'interactive_dialogue', payload: {
                imageUrl: 'images/item_wallet.png', 
                title: '地上的钱包',
                text: '你发现地上有一个鼓鼓囊囊的钱包。\n你会怎么做？',
                options: [
                    { text: '【拾金不昧】交到失物招领处', actionBlock: [
                        { action: { type: 'log', payload: { text: '你捡起钱包，送到了旁边的失物招领处。感觉心里很踏实。' } } },
                        { action: { type: 'destroy_hotspot' } }
                    ]},
                    { text: '【收入囊中】这下发财了！', actionBlock: [
                        { action: { type: 'log', payload: { text: '你迅速捡起钱包塞进了口袋，心脏怦怦直跳。' } } },
                        { action: { type: 'effect', payload: { gold: 500 } } },
                         { action: { type: 'destroy_hotspot' } }
                    ]}
                ]
            }}},
            { 
                label: "公告栏", x: 65, y: 30, 
                interaction: { 
                    type: 'interactive_dialogue', 
                    payload: {
                        imageUrl: 'images/location_board.png',
                        title: '公告栏',
                        dialogueText: '这里有很多兼职信息可以接取。',
                        options: [
                            { 
                                text: '看看有什么兼职',
                                subDialogue: {
                                    type: 'job_board',
                                    payload: {
                                        title: '兼职公告栏',
                                        jobs: [
                                            { id: 'job_flyer' },
                                            { id: 'job_waiter' },
                                            { id: 'job_tutor' },
                                        ]
                                    }
                                }
                            },
                            {
                                text: '汇报传单派发工作',
                                conditions: [{ type: 'variable', varId: 'q_job_flyer', comparison: '==', value: 1 }],
                                actionBlock: [
                                    { action: { type: 'complete_quest', payload: { questId: 'quest_job_flyer' } } }
                                ]
                            },
                            {
                                text: '汇报家教工作',
                                conditions: [{ type: 'variable', varId: 'q_job_tutor', comparison: '==', value: 1 }],
                                actionBlock: [
                                    { action: { type: 'complete_quest', payload: { questId: 'quest_job_tutor' } } }
                                ]
                            },
                            { text: '下次再说', actionBlock: [] }
                        ]
                    }
                }
            }
        ] 
    },
    "location_old_home": { name: "老家的房子", description: "充满回忆的旧屋，院子里有棵大槐树。", imageUrl: "images/location_old_home.png", hotspots: [
            { label: "返回地图", x: 50, y: 50, interaction: { type: 'interactive_dialogue', payload: {
                title: '返回地图',
                options: [
                    { text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
                    { text: '算了', actionBlock: [], class: 'secondary-action' }
                ]
            } } }
        ] },
	"location_grandma_home": { name: "姥姥家的房子", description: "姥姥就住在老家隔壁，你小时候经常在这里玩。", imageUrl: "images/location_grandma_home.png", hotspots: [
            { label: "返回地图", x: 80, y: 80, 
				interaction: { 
					type: 'interactive_dialogue', 
					payload: {
						title: '返回地图',
						options: [
							{ text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
							{ text: '算了', actionBlock: [], class: 'secondary-action' }
						]
            } } },
			
			{ label: "姥姥", x: 60, y: 40, interaction: { type: 'interactive_dialogue', payload: {
                title: '姥姥', 
                imageUrl: 'images/grandma.png',
                dialogueText: [
                    '哎呦，外孙来啦！快让姥姥看看！',
                    '乖孙想吃什么？\n姥姥给你做。'
                ],
                options: [
                    { text: '“姥姥身体健康。”', 
						actionBlock: [],
                        followUp: {
                          dialogueText: '姥姥笑得很灿烂：“乖孙，来，给你零花钱。”',
                          options: [
                              { text: '“谢谢姥姥。”', actionBlock: [ 
                                  { action: { type: 'log', payload: { text: '姥姥往你手里塞了200块。' } } },
                                  { action: { type: 'effect', payload: { gold: 200 } } },
                                ] 
                              }
                          ]
                      }
                    },
                    { 
                        text: '“姥姥，这是我妈让我给您带的咸鱼。”',
                        conditions: [
                            { type: 'variable', varId: 'q_visit_grandma', comparison: '==', value: 1 },
                            { type: 'has_item', itemId: 'item_salted_fish', quantity: 2 }
                        ],
                        actionBlock: [
                            { action: { type: 'remove_item', payload: { itemId: 'item_salted_fish', quantity: 2 } } },
                            { action: { type: 'complete_quest', payload: { questId: 'quest_visit_grandma' } } },
                        ],
                        followUp: {
                            dialogueText: '姥姥接过咸鱼：“有心了。”',
                            options: [
                                { 
                                    text: '“嘿嘿，姥姥喜欢吃咸鱼吗？”',
                                    followUp: {
                                        dialogueText: '“那可太喜欢了，每周必吃！”',
                                        options: [ { text: '（结束对话）' } ]
                                    }
                                },
                                {
                                    text: '“咸鱼有什么好吃的？我喜欢吃排骨。”',
                                    conditions: [{ type: 'variable', varId: 'q_buy_ribs', comparison: '!=', value: 1 }],
                                    followUp: {
                                        dialogueText: '“你喜欢吃排骨？那给你个任务。\n去菜市场买2斤排骨，姥姥中午给你做排骨吃。”',
                                        options: [
                                            {
                                                text: '“好的！”',
                                                actionBlock: [
                                                    { action: { type: 'log', payload: { text: '姥姥给了你100元买排骨。' } } },
                                                    { action: { type: 'effect', payload: { gold: 100 } } },
                                                    { action: { type: 'acceptJob', payload: { jobId: 'job_buy_ribs' } } }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        text: '“姥姥，排骨买回来啦！”',
                        conditions: [
                            { type: 'variable', varId: 'q_buy_ribs', comparison: '==', value: 1 },
                            { type: 'has_item', itemId: 'item_ribs', quantity: 2 }
                        ],
                        actionBlock: [
                            { action: { type: 'remove_item', payload: { itemId: 'item_ribs', quantity: 2 } } },
                            { action: { type: 'complete_quest', payload: { questId: 'quest_buy_ribs' } } }
                        ]
                    }
                ]
            }}},
			
        ] },
    "location_market": {
        name: "老家菜市场",
        description: "一个充满烟火气的地方，各种叫卖声此起彼伏。",
        imageUrl: "images/location_market.png",
        hotspots: [
            { 
                label: "返回地图", x: 80, y: 80, 
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '离开菜市场',
                    options: [
                        { text: '确认', actionBlock: [{ action: { type: 'showMap' } }] },
                        { text: '再逛逛', actionBlock: [] }
                    ]
                }}
            },
            {
                label: "肉摊", x: 50, y: 50,
                interaction: { type: 'interactive_dialogue', payload: {
                    title: '肉摊贩子',
                    imageUrl: 'images/butcher.png',
                    dialogueText: '“小伙子，买点什么？肉都新鲜得很！”',
                    options: [
                        {
                            text: '“老板，来1斤排骨。” (30金)',
                            conditions: [ { type: 'stat', stat: 'gold', comparison: '>=', value: 30 } ],
                            actionBlock: [
                                { action: { type: 'effect', payload: { gold: -30 } } },
                                { action: { type: 'add_item', payload: { itemId: 'item_ribs', quantity: 1 } } },
                            ],
                            followUp: {
                                dialogueText: '“好嘞！给你挑最好的！拿好！”',
                                options: [ { text: '“谢谢老板。”' } ]
                            }
                        },
                        {
                            text: '（钱不够买排骨）',
                            conditions: [ { type: 'stat', stat: 'gold', comparison: '<', value: 30 } ],
                            actionBlock: []
                        },
                         {
                            text: '“随便看看。”',
                            actionBlock: []
                        }
                    ]
                }}
            }
        ]
    }
};