export const dialogueData = {
  start: {
    id: 'start',
    name: '序章 - 相遇',
    nextDialogue: 'chapter1',
    nodes: [
      {
        id: 'intro_1',
        type: 'dialogue',
        background: 'bg_street',
        speaker: '旁白',
        text: '这是一个阳光明媚的早晨，你像往常一样走在去咖啡店的路上。'
      },
      {
        id: 'intro_2',
        type: 'dialogue',
        background: 'bg_street',
        speaker: '旁白',
        text: '突然，一个身影从转角冲了出来——'
      },
      {
        id: 'intro_3',
        type: 'dialogue',
        background: 'bg_street',
        character: 'char_heroine_normal',
        speaker: '???',
        text: '哇啊！对不起对不起！我赶时间...诶？'
      },
      {
        id: 'intro_4',
        type: 'dialogue',
        background: 'bg_street',
        character: 'char_heroine_normal',
        speaker: '???',
        text: '你是...新搬来的邻居吗？我叫小雪！'
      },
      {
        id: 'intro_choice',
        type: 'choice',
        choices: [
          {
            text: '是的，我刚搬来不久。你好！',
            addAffection: 5,
            next: 'intro_friendly'
          },
          {
            text: '嗯...你撞到我了。',
            addAffection: -3,
            next: 'intro_cold'
          },
          {
            text: '（微笑）没关系，你好像很着急？',
            addAffection: 10,
            next: 'intro_kind'
          }
        ]
      },
      {
        id: 'intro_friendly',
        type: 'dialogue',
        background: 'bg_street',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '太好了！以后我们就是朋友啦！我就在前面那家咖啡店打工哦~'
      },
      {
        id: 'intro_friendly_next',
        type: 'action',
        setFlag: 'first_impression',
        flagValue: 'friendly',
        next: 'intro_end'
      },
      {
        id: 'intro_cold',
        type: 'dialogue',
        background: 'bg_street',
        character: 'char_heroine_shy',
        speaker: '小雪',
        text: '啊...真的对不起！我请你喝咖啡赔罪吧！'
      },
      {
        id: 'intro_cold_next',
        type: 'action',
        setFlag: 'first_impression',
        flagValue: 'cold',
        next: 'intro_end'
      },
      {
        id: 'intro_kind',
        type: 'dialogue',
        background: 'bg_street',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '嗯！我要去咖啡店打工，差点迟到了！你...要不要来喝杯咖啡？'
      },
      {
        id: 'intro_kind_next',
        type: 'action',
        setFlag: 'first_impression',
        flagValue: 'kind',
        next: 'intro_end'
      },
      {
        id: 'intro_end',
        type: 'dialogue',
        background: 'bg_street',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '那我先走啦！记得来找我玩哦！'
      },
      {
        id: 'intro_end_2',
        type: 'dialogue',
        background: 'bg_street',
        speaker: '旁白',
        text: '看着她匆匆离去的背影，你决定...'
      },
      {
        id: 'intro_end_choice',
        type: 'choice',
        choices: [
          {
            text: '去咖啡店看看',
            addAffection: 5,
            next: 'go_cafe'
          },
          {
            text: '回家休息',
            next: 'go_home'
          }
        ]
      },
      {
        id: 'go_cafe',
        type: 'dialogue',
        background: 'bg_cafe',
        speaker: '旁白',
        text: '你来到了那家咖啡店，透过玻璃窗，看到小雪正在忙碌地工作着。'
      },
      {
        id: 'go_cafe_2',
        type: 'action',
        setFlag: 'visited_cafe',
        flagValue: true,
        next: 'chapter_end'
      },
      {
        id: 'go_home',
        type: 'dialogue',
        background: 'bg_street',
        speaker: '旁白',
        text: '你决定先回家休息，改天再去看看。'
      },
      {
        id: 'chapter_end',
        type: 'dialogue',
        background: 'bg_cafe',
        speaker: '旁白',
        text: '【序章结束】'
      }
    ]
  },

  chapter1: {
    id: 'chapter1',
    name: '第一章 - 了解',
    nextDialogue: 'chapter2',
    nodes: [
      {
        id: 'ch1_start',
        type: 'dialogue',
        background: 'bg_cafe',
        speaker: '旁白',
        text: '几天后，你又来到了咖啡店...'
      },
      {
        id: 'ch1_1',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '欢迎光临！啊，是你！'
      },
      {
        id: 'ch1_2',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '今天想喝点什么？我推荐我们的招牌拿铁~'
      },
      {
        id: 'ch1_choice',
        type: 'choice',
        choices: [
          {
            text: '那就来一杯招牌拿铁吧',
            addAffection: 5,
            next: 'ch1_latte'
          },
          {
            text: '你有什么特别推荐的吗？',
            addAffection: 8,
            next: 'ch1_special'
          },
          {
            text: '只要一杯美式就好',
            addAffection: 0,
            next: 'ch1_americano'
          }
        ]
      },
      {
        id: 'ch1_latte',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '好的！我给你用心做一杯，保证好喝！'
      },
      {
        id: 'ch1_latte_2',
        type: 'action',
        next: 'ch1_minigame_intro'
      },
      {
        id: 'ch1_special',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '嗯...既然你问了，我给你做一杯我的特调吧！这是我的秘密配方哦~'
      },
      {
        id: 'ch1_special_2',
        type: 'action',
        addAffection: 5,
        next: 'ch1_minigame_intro'
      },
      {
        id: 'ch1_americano',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '好的，美式一杯。你看起来很累呢，要注意休息哦。'
      },
      {
        id: 'ch1_americano_2',
        type: 'action',
        next: 'ch1_minigame_intro'
      },
      {
        id: 'ch1_minigame_intro',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '对了，我在学做咖啡拉花，你能帮我看看这个像什么吗？'
      },
      {
        id: 'ch1_minigame',
        type: 'action',
        miniGame: {
          type: 'quiz',
          question: '小雪做的拉花看起来像什么？',
          options: ['爱心', '猫', '一坨云', '不知道'],
          correctIndex: 1,
          successAffection: 10,
          failAffection: -5
        }
      },
      {
        id: 'ch1_after_minigame',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_shy',
        speaker: '小雪',
        text: '嘿嘿，我还在练习中啦...不过你能看出来是猫就太好了！'
      },
      {
        id: 'ch1_evidence_intro',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '对了，这个给你，是我做的饼干，你尝尝看！'
      },
      {
        id: 'ch1_evidence',
        type: 'action',
        addEvidence: {
          id: 'homemade_cookie',
          name: '小雪的手工饼干',
          description: '小雪亲手做的饼干，形状有点歪，但闻起来很香。'
        }
      },
      {
        id: 'ch1_end',
        type: 'dialogue',
        background: 'bg_cafe',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '欢迎下次再来哦！我会等你的~'
      },
      {
        id: 'ch1_end_2',
        type: 'dialogue',
        background: 'bg_cafe',
        speaker: '旁白',
        text: '【第一章结束】'
      }
    ]
  },

  chapter2: {
    id: 'chapter2',
    name: '第二章 - 约会',
    nodes: [
      {
        id: 'ch2_start',
        type: 'dialogue',
        background: 'bg_park',
        speaker: '旁白',
        text: '周末，你收到了小雪的消息...'
      },
      {
        id: 'ch2_1',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '今天天气真好！要不要一起去公园散步？'
      },
      {
        id: 'ch2_choice',
        type: 'choice',
        choices: [
          {
            text: '好啊，我很期待！',
            addAffection: 10,
            next: 'ch2_date'
          },
          {
            text: '我有点事...',
            addAffection: -10,
            next: 'ch2_reject'
          }
        ]
      },
      {
        id: 'ch2_reject',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_shy',
        speaker: '小雪',
        text: '这样啊...那下次吧...'
      },
      {
        id: 'ch2_reject_2',
        type: 'condition',
        condition: {
          type: 'affection',
          value: 30
        },
        trueNext: 'ch2_reject_sad',
        falseNext: 'ending_bad'
      },
      {
        id: 'ch2_reject_sad',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '没关系，我理解。我们还是朋友，对吧？'
      },
      {
        id: 'ch2_reject_sad_2',
        type: 'action',
        next: 'ending_normal'
      },
      {
        id: 'ch2_date',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_happy',
        speaker: '小雪',
        text: '太好了！我知道公园里有一个很漂亮的地方，跟我来！'
      },
      {
        id: 'ch2_date_2',
        type: 'dialogue',
        background: 'bg_park',
        speaker: '旁白',
        text: '你们来到了公园的一个小湖边，阳光洒在水面上，波光粼粼。'
      },
      {
        id: 'ch2_date_3',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_shy',
        speaker: '小雪',
        text: '其实...我有话想跟你说...'
      },
      {
        id: 'ch2_date_choice',
        type: 'choice',
        choices: [
          {
            text: '我也有话想说',
            addAffection: 15,
            next: 'ch2_confession_good'
          },
          {
            text: '你说吧，我在听',
            addAffection: 5,
            next: 'ch2_confession_normal'
          },
          {
            text: '（紧张地等待）',
            next: 'ch2_confession_wait'
          }
        ]
      },
      {
        id: 'ch2_confession_good',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_shy',
        speaker: '小雪',
        text: '我...我喜欢你！从第一次见面开始，我就觉得你很特别...'
      },
      {
        id: 'ch2_confession_good_2',
        type: 'action',
        next: 'check_ending'
      },
      {
        id: 'ch2_confession_normal',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_shy',
        speaker: '小雪',
        text: '我...我想说，和你在一起很开心。你愿意...继续做我的朋友吗？'
      },
      {
        id: 'ch2_confession_normal_2',
        type: 'action',
        next: 'check_ending'
      },
      {
        id: 'ch2_confession_wait',
        type: 'dialogue',
        background: 'bg_park',
        character: 'char_heroine_normal',
        speaker: '小雪',
        text: '算了，没什么...今天天气真好呢。'
      },
      {
        id: 'ch2_confession_wait_2',
        type: 'action',
        next: 'check_ending'
      },
      {
        id: 'check_ending',
        type: 'condition',
        condition: {
          type: 'affection',
          value: 50
        },
        trueNext: 'check_good_ending',
        falseNext: 'check_normal_ending'
      },
      {
        id: 'check_good_ending',
        type: 'condition',
        condition: {
          type: 'affection',
          value: 80
        },
        trueNext: 'ending_good',
        falseNext: 'ending_normal'
      },
      {
        id: 'check_normal_ending',
        type: 'condition',
        condition: {
          type: 'affection',
          value: 20
        },
        trueNext: 'ending_normal',
        falseNext: 'ending_bad'
      },
      {
        id: 'ending_good',
        type: 'ending',
        endingId: 'good'
      },
      {
        id: 'ending_normal',
        type: 'ending',
        endingId: 'normal'
      },
      {
        id: 'ending_bad',
        type: 'ending',
        endingId: 'bad'
      }
    ]
  }
}
