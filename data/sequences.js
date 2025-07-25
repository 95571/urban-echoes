/**
 * @file data/sequences.js
 * @description 游戏内容 - 问答序列 (如开场创建角色) (v52.0.0)
 */
window.gameData.questionSequences = {
    "character_creation": {
        startQuestionId: "q_background",
        questions: {
            "q_background": {
                type: 'multiple_choice',
                text: "站在人生的十字路口，你来自怎样的家庭？",
                imageUrl: "images/location_home.png",
                answers: [
                    {
                        text: "普通家庭：父母是工薪阶层，生活平淡但安稳。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你出生在一个普通的家庭，不好也不坏。" } } },
                            { action: { type: 'effect', payload: { stats: { con: 1, int: 1 }, gold: 2000 } } }
                        ],
                        transition: "q_childhood_memory"
                    },
                    {
                        text: "单亲家庭：由母亲一人抚养长大，更早熟独立。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你在单亲家庭长大，这让你更加坚强。" } } },
                            { action: { type: 'effect', payload: { stats: { int: 1, lck: 1 }, gold: 1000 } } }
                        ],
                        transition: "q_childhood_memory"
                    },
                    {
                        text: "小镇青年：来自周边小镇，对大城市充满向往。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你带着全村的希望来到杭城，未来要靠自己打拼。" } } },
                            { action: { type: 'effect', payload: { stats: { str: 1, con: 1 }, gold: 3000 } } }
                        ],
                        transition: "q_childhood_memory"
                    }
                ]
            },
            "q_childhood_memory": {
                type: 'multiple_choice',
                text: "回忆童年，哪段记忆最为深刻？",
                imageUrl: "images/location_park.png",
                answers: [
                    {
                        text: "第一次解出数学难题后的喜悦。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你对知识的渴望，从那时便已萌芽。" } } },
                            { action: { type: 'effect', payload: { stats: { int: 2 } } } }
                        ],
                        transition: {
                            type: 'random',
                            outcomes: [
                                { id: 'q_part_time_job', weight: 80 },
                                { id: 'q_special_event', weight: 20 }
                            ]
                        }
                    },
                    {
                        text: "在运动会上为班级赢得荣誉的瞬间。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "强健的体魄是你最大的本钱。" } } },
                            { action: { type: 'effect', payload: { stats: { str: 1, dex: 1 } } } }
                        ],
                        transition: "q_part_time_job"
                    }
                ]
            },
            "q_part_time_job": {
                type: 'multiple_choice',
                text: "大学期间，你通过哪种方式赚取零花钱？",
                imageUrl: "images/location_downtown.png",
                answers: [
                    {
                        text: "家教：将知识变现。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "你通过分享知识获得了报酬。" } } },
                            { action: { type: 'effect', payload: { gold: 500 } } }
                        ],
                        transition: "q_name"
                    },
                    {
                        text: "餐厅服务员：体验劳动的辛苦。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "辛勤的劳动让你对金钱有了更深的理解。" } } },
                            { action: { type: 'effect', payload: { gold: 800 } } }
                        ],
                        transition: "q_name"
                    }
                ]
            },
            "q_special_event": {
                type: 'multiple_choice',
                text: "你回忆起，在一次编程竞赛中，你凭借一个巧妙的算法获得了意外的名次，这让你...",
                imageUrl: "images/location_study.png",
                answers: [
                    {
                        text: "对计算机科学产生了浓厚的兴趣。",
                        actionBlock: [
                            { action: { type: 'log', payload: { text: "一个偶然的机会，为你打开了新世界的大门。" } } },
                            { action: { type: 'effect', payload: { stats: { int: 1 } } } },
                            { action: { type: 'modify_variable', payload: { varId: 'programming_aptitude', operation: 'add', value: 10 } } }
                        ],
                        transition: "q_name"
                    }
                ]
            },
            "q_name": {
                type: 'text_input',
                text: "你将以何姓名，开始你在杭城的故事？",
                imageUrl: "images/creation_name.png",
                answers: [
                    {
                        text: "以此之名，踏上旅途",
                        transition: "END_SEQUENCE"
                    }
                ]
            }
        }
    }
};