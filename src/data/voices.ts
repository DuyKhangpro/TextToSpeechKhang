import type { Language, VoiceMetadata, VoicePreset } from "../types/tts";

export const VOICES: VoiceMetadata[] = [
  {
    id: "Kore",
    name: "Kore",
    genderLabel: { vi: "Nữ", en: "Female" },
    toneLabel: { vi: "Chắc chắn · Trong trẻo", en: "Firm · Clear" },
    description: {
      vi: "Giọng nữ cân bằng, phát âm chuẩn xác, phù hợp dẫn tin tức, giáo dục và trợ lý.",
      en: "Balanced female voice with crisp articulation, ideal for news, education, and narration.",
    },
    bestFor: { vi: "Tin tức, Bài giảng", en: "News, Tutorials" },
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    genderLabel: { vi: "Nữ", en: "Female" },
    toneLabel: { vi: "Tươi sáng · Nhẹ nhàng", en: "Bright · Airy" },
    description: {
      vi: "Chất giọng trẻ trung, thân thiện và giàu năng lượng tích cực cho podcast hoặc review.",
      en: "Youthful, friendly, and upbeat tone great for podcasts, lifestyle, and brand stories.",
    },
    bestFor: { vi: "Podcast, Quảng cáo", en: "Podcasts, Promos" },
  },
  {
    id: "Puck",
    name: "Puck",
    genderLabel: { vi: "Nam", en: "Male" },
    toneLabel: { vi: "Năng động · Tự nhiên", en: "Upbeat · Expressive" },
    description: {
      vi: "Giọng nam linh hoạt, bắt nhịp hội thoại tốt, tạo cảm giác gần gũi và lôi cuốn.",
      en: "Dynamic male voice with lively pacing, natural for conversations and storytelling.",
    },
    bestFor: { vi: "Đối thoại, YouTube", en: "Dialogues, YouTube" },
  },
  {
    id: "Charon",
    name: "Charon",
    genderLabel: { vi: "Nam", en: "Male" },
    toneLabel: { vi: "Trầm ấm · Đĩnh đạc", en: "Deep · Informative" },
    description: {
      vi: "Âm sắc trầm sâu và điềm tĩnh, tạo độ tin cậy cao cho phim tài liệu và sách nói.",
      en: "Deep, composed baritone conveying authority for documentaries and audiobooks.",
    },
    bestFor: { vi: "Tài liệu, Sách nói", en: "Documentary, Audiobooks" },
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    genderLabel: { vi: "Nam", en: "Male" },
    toneLabel: { vi: "Mạnh mẽ · Kịch tính", en: "Excitable · Bold" },
    description: {
      vi: "Giọng nam nội lực, giàu cảm xúc cao trào cho trailer, giới thiệu sản phẩm và kể chuyện.",
      en: "Energetic, resonant voice suited for trailers, launches, and dramatic reads.",
    },
    bestFor: { vi: "Trailer, Giới thiệu", en: "Trailers, Launches" },
  },
];

export const CURATED_STYLE_PRESETS: VoicePreset[] = [
  {
    id: "news-anchor",
    name: { vi: "Phát thanh viên tin tức", en: "News Anchor" },
    voiceName: "Kore",
    stylePrompt: "Clear, authoritative news anchor with crisp pacing and neutral professional tone",
    category: { vi: "Truyền thông", en: "Broadcast" },
  },
  {
    id: "late-night-story",
    name: { vi: "Kể chuyện đêm khuya", en: "Late-Night Storyteller" },
    voiceName: "Charon",
    stylePrompt: "Warm, unhurried, intimate late-night storyteller with gentle pauses and soft resonance",
    category: { vi: "Kể chuyện", en: "Storytelling" },
  },
  {
    id: "podcast-host",
    name: { vi: "Host Podcast sôi nổi", en: "Upbeat Podcast Host" },
    voiceName: "Zephyr",
    stylePrompt: "Friendly, conversational, enthusiastic podcast host smiling while speaking",
    category: { vi: "Podcast", en: "Podcast" },
  },
  {
    id: "product-promo",
    name: { vi: "Quảng cáo truyền cảm hứng", en: "Brand Commercial" },
    voiceName: "Fenrir",
    stylePrompt: "Confident, inspiring commercial narrator with dynamic emphasis on key phrases",
    category: { vi: "Quảng cáo", en: "Commercial" },
  },
  {
    id: "calm-guide",
    name: { vi: "Hướng dẫn thư giãn", en: "Calm Meditation Guide" },
    voiceName: "Zephyr",
    stylePrompt: "Soft, soothing, slow-paced mindfulness guide with peaceful breathing cadence",
    category: { vi: "Thư giãn", en: "Wellness" },
  },
  {
    id: "tech-explainer",
    name: { vi: "Giảng viên công nghệ", en: "Tech Explainer" },
    voiceName: "Puck",
    stylePrompt: "Engaging, articulate educator explaining complex ideas clearly and warmly",
    category: { vi: "Giáo dục", en: "Education" },
  },
];

export interface ExpressionTag {
  tag: string;
  label: Record<Language, string>;
  hint: Record<Language, string>;
}

export const EXPRESSION_TAGS: ExpressionTag[] = [
  {
    tag: "<breath>",
    label: { vi: "Hít thở", en: "Breath" },
    hint: { vi: "Tạo nhịp lấy hơi tự nhiên", en: "Natural inhale pause" },
  },
  {
    tag: "<laugh>",
    label: { vi: "Cười nhẹ", en: "Laugh" },
    hint: { vi: "Thêm tiếng cười tự nhiên", en: "Add light laughter" },
  },
  {
    tag: "<gasp>",
    label: { vi: "Ngạc nhiên", en: "Gasp" },
    hint: { vi: "Biểu cảm thốt lên bất ngờ", en: "Surprised intake of breath" },
  },
  {
    tag: "|mhm|",
    label: { vi: "Ừm hứ", en: "|mhm|" },
    hint: { vi: "Âm đệm đồng tình khi nghe", en: "Subtle backchannel agreement" },
  },
  {
    tag: "|yeah|",
    label: { vi: "Đúng rồi", en: "|yeah|" },
    hint: { vi: "Phản hồi hưởng ứng nhanh", en: "Conversational affirmation" },
  },
];

export const SAMPLE_SCRIPTS = {
  singleNews: {
    vi: {
      title: "Bản tin công nghệ sáng",
      voiceName: "Kore" as const,
      stylePrompt: "Clear, professional morning tech news anchor with crisp pacing",
      text: "Chào buổi sáng quý vị. Trong bản tin công nghệ hôm nay, trí tuệ nhân tạo tạo sinh đang thay đổi cách các nhà sáng tạo nội dung sản xuất âm thanh và video. Chỉ với vài dòng kịch bản, người dùng giờ đây có thể tổng hợp giọng đọc đa sắc thái, tự nhiên như thu âm tại phòng thu chuyên nghiệp.",
    },
    en: {
      title: "Morning Tech Brief",
      voiceName: "Kore" as const,
      stylePrompt: "Clear, professional morning tech news anchor with crisp pacing",
      text: "Good morning. In today's technology brief, generative speech models are transforming how independent creators produce podcasts, audiobooks, and localized video. With expressive direction controls, a single script can now come alive in seconds with studio-grade clarity.",
    },
  },
  singleStory: {
    vi: {
      title: "Góc phố sau cơn mưa",
      voiceName: "Charon" as const,
      stylePrompt: "Warm, unhurried, reflective storyteller with gentle pauses",
      text: "Cơn mưa rào cuối chiều vừa dứt, để lại mặt đường lát đá ánh lên sắc đèn vàng dịu nhẹ. <breath> Từ quán cà phê nhỏ ở góc phố, mùi hạt rang mới quyện trong làn gió mát, khiến bất kỳ ai đi ngang cũng muốn bước chậm lại một nhịp.",
    },
    en: {
      title: "Rainy Corner Cafe",
      voiceName: "Charon" as const,
      stylePrompt: "Warm, unhurried, reflective storyteller with gentle pauses",
      text: "The late afternoon rain had just cleared, leaving the cobblestone street shimmering beneath warm amber streetlamps. <breath> From the tiny corner cafe, the aroma of freshly roasted beans drifted into the cool air, inviting every passerby to slow down for a moment.",
    },
  },
  dialoguePodcast: {
    vi: {
      title: "Podcast: Tương lai giọng nói AI",
      speakerA: {
        speakerName: "Minh",
        voiceName: "Puck" as const,
        stylePrompt: "Enthusiastic, curious podcast host",
      },
      speakerB: {
        speakerName: "Linh",
        voiceName: "Zephyr" as const,
        stylePrompt: "Warm, insightful audio producer",
      },
      turns: [
        {
          speakerRole: "A" as const,
          text: "Chào mừng mọi người quay lại với Podcast Thanh Âm! <breath> Hôm nay tụi mình sẽ nói về một chủ đề rất thú vị: liệu giọng đọc AI có thể truyền tải được cảm xúc thật hay không?",
        },
        {
          speakerRole: "B" as const,
          text: "Câu hỏi hay đấy Minh. |yeah| Trước đây giọng máy nghe khá đều và khô, nhưng hiện tại mô hình đã biết nhấn nhá, lấy hơi, thậm chí bật cười đúng lúc nữa.",
        },
        {
          speakerRole: "A" as const,
          text: "<laugh> Nghe cuốn thật sự! Vậy theo Linh, điều quan trọng nhất để một kịch bản nghe tự nhiên là gì?",
        },
        {
          speakerRole: "B" as const,
          text: "Chính là nhịp ngắt nghỉ và cách mình viết câu ngắn gọn như văn nói hằng ngày |mhm| chứ không phải văn viết quá cứng nhắc.",
        },
      ],
    },
    en: {
      title: "Podcast: The Future of AI Voice",
      speakerA: {
        speakerName: "Alex",
        voiceName: "Puck" as const,
        stylePrompt: "Enthusiastic, curious podcast host",
      },
      speakerB: {
        speakerName: "Maya",
        voiceName: "Zephyr" as const,
        stylePrompt: "Warm, insightful audio producer",
      },
      turns: [
        {
          speakerRole: "A" as const,
          text: "Welcome back to the Soundcraft Podcast! <breath> Today we're tackling a big question: can synthesized speech actually feel human?",
        },
        {
          speakerRole: "B" as const,
          text: "That's the magic right now, Alex. |yeah| Earlier voices sounded flat, but modern models capture subtle breaths, pacing shifts, and genuine warmth.",
        },
        {
          speakerRole: "A" as const,
          text: "<laugh> It really changes the game for indie creators. What's your top tip for writing great dialogue?",
        },
        {
          speakerRole: "B" as const,
          text: "Write for the ear, not the page |mhm| Keep sentences conversational, vary their length, and leave room to breathe.",
        },
      ],
    },
  },
  dialogueCafe: {
    vi: {
      title: "Cuộc hẹn sáng thứ Bảy",
      speakerA: {
        speakerName: "Khoa",
        voiceName: "Fenrir" as const,
        stylePrompt: "Playful, expressive friend",
      },
      speakerB: {
        speakerName: "An",
        voiceName: "Kore" as const,
        stylePrompt: "Witty, cheerful friend",
      },
      turns: [
        {
          speakerRole: "A" as const,
          text: "Khoan đã An ơi! <gasp> Đừng nói với mình là cậu dậy từ sáu giờ sáng để chạy bộ thật đấy nhé?",
        },
        {
          speakerRole: "B" as const,
          text: "<laugh> Thật chứ sao không! Sáng nay trời mát lắm, chạy xong ghé làm ly cà phê sữa đá là tỉnh cả người.",
        },
        {
          speakerRole: "A" as const,
          text: "|mhm| Nghe cũng thuyết phục đấy... nhưng cho mình khất sang tuần sau nhé, hôm nay mình mới ngủ dậy lúc chín giờ.",
        },
      ],
    },
    en: {
      title: "Saturday Morning Catch-Up",
      speakerA: {
        speakerName: "Leo",
        voiceName: "Fenrir" as const,
        stylePrompt: "Playful, expressive friend",
      },
      speakerB: {
        speakerName: "Chloe",
        voiceName: "Kore" as const,
        stylePrompt: "Witty, cheerful friend",
      },
      turns: [
        {
          speakerRole: "A" as const,
          text: "Wait a second! <gasp> Don't tell me you actually woke up at six a.m. for a ten-kilometer run?",
        },
        {
          speakerRole: "B" as const,
          text: "<laugh> I really did! The morning air was crisp, and grabbing an iced latte right after felt incredible.",
        },
        {
          speakerRole: "A" as const,
          text: "|mhm| That does sound great... let's pencil me in for next Saturday though, I just rolled out of bed.",
        },
      ],
    },
  },
};
