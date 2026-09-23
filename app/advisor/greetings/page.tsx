'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import { getFullName, formatDate, formatPhoneForWhatsapp } from '@/lib/utils';
import { Sparkles, Calendar, Gift, Heart, Printer, Share2, Phone, Mail, Check, Send } from 'lucide-react';

const festivals = [
  { id: 'diwali', name: 'Diwali (दीपावली)', wish: 'Wishing you a bright, prosperous and secure Diwali! May Goddess Lakshmi bless your home with health, wealth and joy.', hindiWish: 'आपको एवं आपके परिवार को दीपावली की हार्दिक शुभकामनाएं! माँ लक्ष्मी आपकी वित्तीय सुरक्षा और समृद्धि का मार्ग प्रशस्त करें।' },
  { id: 'holi', name: 'Holi (होली)', wish: 'Wishing you a colorful Holi! May your life be filled with the colors of happiness, peace, and financial safety.', hindiWish: 'रंगों के महापर्व होली की हार्दिक शुभकामनाएं! ईश्वर आपके जीवन और निवेश पोर्टफोलियो को सुरक्षित रंगों से भर दें।' },
  { id: 'eid', name: 'Eid Mubarak (ईद मुबारक)', wish: 'Eid Mubarak! Wishing you and your family abundant peace, prosperity, good health, and success on this blessed day.', hindiWish: 'ईद मुबारक! आपके जीवन में सुख, शांति, समृद्धि और उत्तम स्वास्थ्य की दुआ करते हैं।' },
  { id: 'newyear', name: 'New Year (नव वर्ष)', wish: 'Happy New Year! Let us plan and build a strong foundation for your financial goals in this new journey.', hindiWish: 'नव वर्ष की मंगलकामनाएं! आइए इस नए वर्ष में आपके वित्तीय सपनों और सुरक्षा को एक नई उड़ान दें।' },
  { id: 'indday', name: 'Independence Day (स्वतंत्रता दिवस)', wish: 'Happy Independence Day! Let us celebrate the spirit of freedom and work towards achieving complete Financial Independence.', hindiWish: 'स्वतंत्रता दिवस की बधाई! आइए आज के दिन वित्तीय स्वतंत्रता (Financial Freedom) का संकल्प लें।' },
  { id: 'christmas', name: 'Merry Christmas (क्रिसमस)', wish: 'Merry Christmas! Sending you warm wishes of love, peace, and financial security to protect your family\'s tomorrow.', hindiWish: 'क्रिसमस की शुभकामनाएं! प्रभु यीशु आपके परिवार को सुरक्षा, प्रेम और खुशहाली का वरदान दें।' },
];

const marketingPosts = [
  { id: 'sip', name: 'Power of SIP (सिप)', title: 'Wealth Creation via SIP', wish: '🚀 Little drops make a mighty ocean. Start a Small Systematic Investment Plan (SIP) today and let compounding build your dream wealth over time!', hindiWish: '🚀 बूंद-बूंद से घड़ा भरता है। आज ही छोटी मासिक बचत (SIP) शुरू करें और चक्रवृद्धि ब्याज (Compounding) की ताकत से अपनी संपत्ति का निर्माण करें!' },
  { id: 'health', name: 'Health Insurance (स्वास्थ्य बीमा)', title: 'Protect Your Wealth', wish: '🏥 Health is wealth, but Medical Bills can wipe out years of savings in days. Secure your family with a comprehensive Health Insurance plan today!', hindiWish: '🏥 स्वास्थ्य ही संपत्ति है, लेकिन अस्पताल के बिल जमा-पूंजी को खत्म कर सकते हैं। आज ही अपने परिवार के लिए सही स्वास्थ्य बीमा (Mediclaim) लें!' },
  { id: 'life', name: 'Life Protection (जीवन सुरक्षा)', title: 'Complete Family Protection', wish: '🛡️ Life insurance is not for the person who passes away; it is for the family who has to survive. Keep your term/endowment policies active.', hindiWish: '🛡️ जीवन बीमा उस व्यक्ति के लिए नहीं है जो चला जाता है, बल्कि उस परिवार के लिए है जो पीछे रह जाता है। अपनी पॉलिसी की सुरक्षा बनाए रखें।' },
];

export default function GreetingsPage() {
  const { clients } = useApp();
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [postType, setPostType] = useState<'birthday' | 'anniversary' | 'festival' | 'marketing'>('birthday');
  const [selectedFestival, setSelectedFestival] = useState<string>('diwali');
  const [selectedMarketing, setSelectedMarketing] = useState<string>('sip');
  const [customMsg, setCustomMsg] = useState<string>('');
  const [useHindi, setUseHindi] = useState(false);
  const [showIllustration, setShowIllustration] = useState(true);
  const [copied, setCopied] = useState(false);

  // AI Greetings Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState<'warm' | 'formal' | 'religious' | 'financial' | 'poetic'>('warm');
  const [aiLang, setAiLang] = useState<'en' | 'hi' | 'hinglish'>('en');
  const [isGenerating, setIsGenerating] = useState(false);

  // Advisor co-branding profile (loaded from the advisor's saved profile)
  const [advisorProfile, setAdvisorProfile] = useState({
    name: 'Advisor',
    company: 'AK Investments & Financial Services',
    phone: '',
    email: 'advisor@aksaarthi.com',
    license: '',
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/advisor/profile');
        if (!res.ok || !active) return;
        const data = await res.json();
        if (!active) return;
        setAdvisorProfile({
          name: data.name || 'Advisor',
          company: data.company || 'AK Investments & Financial Services',
          phone: data.phone || '',
          email: data.email || 'advisor@aksaarthi.com',
          license: [data.arnNumber, data.licenseNumber].filter(Boolean).join(' | '),
        });
      } catch {
        // Keep defaults — this only affects greeting co-branding text.
      }
    })();
    return () => { active = false; };
  }, []);

  const client = clients.find((c) => c.id === selectedClient) || clients[0];
  const clientName = client ? getFullName(client.firstName, client.lastName) : 'Valued Client';

  // Calculate greeting text
  const getGreetingText = () => {
    if (customMsg) return customMsg;

    if (postType === 'birthday') {
      return useHindi
        ? `प्रिय ${clientName},\nजन्मदिन की ढेर सारी शुभकामनाएं! भगवान आपको दीर्घायु, उत्तम स्वास्थ्य, सुख और समृद्धि प्रदान करें। हम आपकी जीवन यात्रा में सदा आपके साथ हैं।`
        : `Dear ${clientName},\n\nWishing you a very Happy Birthday! May this year bring you abundant joy, good health, peace, and prosperity. It is an honor to partner in your financial journey.`;
    }

    if (postType === 'anniversary') {
      return useHindi
        ? `प्रिय ${clientName},\nशादी की सालगिरह की हार्दिक बधाई! आपका यह साथ सदा बना रहे और आपका परिवार सुख-समृद्धि से भरपूर रहे।`
        : `Dear ${clientName},\n\nWarmest congratulations on your Wedding Anniversary! Wishing you another year of love, companionship, safety, and shared financial success.`;
    }

    if (postType === 'festival') {
      const fest = festivals.find((f) => f.id === selectedFestival);
      return useHindi ? fest?.hindiWish || '' : fest?.wish || '';
    }

    if (postType === 'marketing') {
      const post = marketingPosts.find((p) => p.id === selectedMarketing);
      return useHindi ? post?.hindiWish || '' : post?.wish || '';
    }

    return '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAIGreeting = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      
      const promptText = aiPrompt.trim() ? ` (${aiPrompt})` : '';
      let generated = '';
      
      if (postType === 'birthday') {
        if (aiLang === 'en') {
          if (aiTone === 'warm') {
            generated = `Dear ${clientName},\n\nWishing you a birthday filled with love, laughter and beautiful moments! May you always be surrounded by happiness and peace.${promptText}\n\nHave an amazing year ahead!`;
          } else if (aiTone === 'formal') {
            generated = `Dear ${clientName},\n\nOn behalf of AK Investments, wishing you a happy and prosperous birthday. We value our professional association and wish you success.${promptText}\n\nBest regards.`;
          } else if (aiTone === 'religious') {
            generated = `Dear ${clientName},\n\nMay the almighty bless you with long life, perfect health, and endless peace on your birthday. Sharing prayers and warm wishes.${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `Dear ${clientName},\n\nHappy Birthday! A wise financial tip on your special day: 'The best investment you can make is in your future.' Wishing you compound wealth and safety.${promptText}`;
          } else {
            generated = `Dear ${clientName},\n\nHappy Birthday!\n'May your days be filled with brightness,\nAnd your path shine with success.'\nWishing you a year as special as you are.${promptText}`;
          }
        } else if (aiLang === 'hi') {
          if (aiTone === 'warm') {
            generated = `प्रिय ${clientName},\n\nजन्मदिन की ढेर सारी शुभकामनाएं! ईश्वर करे कि यह नया साल आपके जीवन में उत्तम स्वास्थ्य, अपार खुशियां और शांति लेकर आए।${promptText}\n\nआप स्वस्थ रहें, मस्त रहें।`;
          } else if (aiTone === 'formal') {
            generated = `प्रिय ${clientName},\n\nहमारी पूरी टीम की तरफ से आपको जन्मदिन की हार्दिक बधाई। हम आपके वित्तीय लक्ष्यों को पूरा करने में सहयोग के लिए हमेशा तय्यार हैं।${promptText}\n\nशुभकामनाएं।`;
          } else if (aiTone === 'religious') {
            generated = `प्रिय ${clientName},\n\nजन्मदिन की मंगलकामनाएं! ईश्वर की असीम कृपा आप और आपके परिवार पर सदा बनी रहे। प्रभु आपको दीर्घायु और उत्तम स्वास्थ्य प्रदान करें।${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `प्रिय ${clientName},\n\nशुभ जन्मदिन! आज आपके जन्मदिन पर वित्तीय मंत्र: 'बचत आज की, सुरक्षा कल की'। हम आपके उज्ज्वल और सुरक्षित भविष्य की कामना करते हैं।${promptText}`;
          } else {
            generated = `प्रिय ${clientName},\n\n'फूलों सी महकती रहे जिंदगी आपकी,\nखुशियों से भरी रहे हर राह आपकी।'\nजन्मदिन की हार्दिक शुभकामनाएं!${promptText}`;
          }
        } else { // Hinglish
          if (aiTone === 'warm') {
            generated = `Dear ${clientName},\n\nAapko birthday ki bohot bohot badhaai! Ishwar kare aapka har din khushi aur achhi health se bhara rahe.${promptText}\n\nHave a great day!`;
          } else if (aiTone === 'formal') {
            generated = `Dear ${clientName},\n\nAK Investments ki taraf se aapko Happy Birthday. Hamare saath judne ke liye bohot shukriya. Wish you great success.${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `Dear ${clientName},\n\nJanamdin ki bohot badhaai! Bhagwan aapko lambi umar aur dher saara sukh-samridhi pradaan karein.${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `Dear ${clientName},\n\nHappy Birthday! Aaj ka financial tip: 'Chhoti savings hi bade dreams ko poora karti hain.' Wealth aur security bani rahe.${promptText}`;
          } else {
            generated = `Dear ${clientName},\n\n'Khushiyon ki barish ho aapke is janamdin par,\nTarakki ki raah par chalti rahe life har safar.'\nHappy Birthday!${promptText}`;
          }
        }
      } else if (postType === 'anniversary') {
        if (aiLang === 'en') {
          if (aiTone === 'warm') {
            generated = `Dear ${clientName},\n\nHappy Wedding Anniversary! Wishing a beautiful couple another year of love, laughter, companionship and safety.${promptText}`;
          } else if (aiTone === 'formal') {
            generated = `Dear ${clientName},\n\nWarmest congratulations on your anniversary. Wishing you shared prosperity, financial stability, and long-term success together.${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `Dear ${clientName},\n\nMay God bless your sacred bond with continuous love, patience, and mutual respect. Happy Anniversary!${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `Dear ${clientName},\n\nHappy Anniversary! Financial tip: 'Joint planning makes dreams happen faster.' Keep securing your family's future together.${promptText}`;
          } else {
            generated = `Dear ${clientName},\n\nHappy Anniversary!\n'A union made of trust and grace,\nMay love light up your shared space.'${promptText}`;
          }
        } else if (aiLang === 'hi') {
          if (aiTone === 'warm') {
            generated = `प्रिय ${clientName},\n\nशादी की वर्षगांठ की हार्दिक बधाई! आपका प्रेम और आपसी साथ सदा ऐसे ही बना रहे।${promptText}\n\nसदा खुशहाल रहें।`;
          } else if (aiTone === 'formal') {
            generated = `प्रिय ${clientName},\n\nआपको और आपके जीवनसाथी को वर्षगांठ की व्यावसायिक बधाई। आपके सह-निवेश और साझा सपनों के लिए हमारी शुभकामनाएं।${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `प्रिय ${clientName},\n\nविवाह वर्षगांठ की मंगलकामनाएं! ईश्वर करे कि आपकी यह सुंदर जोड़ी सदा सुखी और संपन्न रहे।${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `प्रिय ${clientName},\n\nहैप्पी एनिवर्सरी! आज का साझा वित्तीय मंत्र: 'एक साथ निवेश, एक साथ उन्नति'। अपने परिवार को पूर्ण सुरक्षित रखें।${promptText}`;
          } else {
            generated = `प्रिय ${clientName},\n\n'जन्म-जन्म का साथ रहे आपका ऐसा,\nखुशियों का चमन खिला रहे हमेशा।'\nशादी की सालगिरह मुबारक!${promptText}`;
          }
        } else { // Hinglish
          if (aiTone === 'warm') {
            generated = `Dear ${clientName},\n\nAapko shaadi ki saalgirah ki bohot badhaai! Aap dono ki jodi hamesha salamat rahe aur khushiyan bani rahein.${promptText}`;
          } else if (aiTone === 'formal') {
            generated = `Dear ${clientName},\n\nAnniversary ki hardik badhaai. Aap dono ki partnership financial aur personal goals dono me safal ho.${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `Dear ${clientName},\n\nHappy Anniversary! Bhagwan aap dono par apni kripa hamesha banaye rakhein.${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `Dear ${clientName},\n\nHappy Anniversary! Financial tip: 'Milkar budget banana aur savings karna family ko bulletproof banata hai.'${promptText}`;
          } else {
            generated = `Dear ${clientName},\n\n'Salamat rahe aap dono ka ye pyaara saath,\nKhushiyan aati rahein din aur raat.'\nHappy Anniversary!${promptText}`;
          }
        }
      } else if (postType === 'festival') {
        const fest = festivals.find((f) => f.id === selectedFestival)?.name || 'Festivals';
        if (aiLang === 'en') {
          if (aiTone === 'warm') {
            generated = `Warm greetings on ${fest}! May this festive season fill your life with positive energy, good health, and joyful celebrations.${promptText}`;
          } else if (aiTone === 'formal') {
            generated = `On the auspicious occasion of ${fest}, AK Investments wishes you and your family success, financial safety, and growth.${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `May the divine blessings of ${fest} bring peace to your home, safety to your family, and light to your life.${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `Happy ${fest}! Let us celebrate by taking a step towards securing our family's future with correct wealth plans.${promptText}`;
          } else {
            generated = `Happy ${fest}!\n'May the colors of joy and lights of grace,\nFill your heart and warm your space.'${promptText}`;
          }
        } else if (aiLang === 'hi') {
          if (aiTone === 'warm') {
            generated = `${fest} की हार्दिक शुभकामनाएं! त्योहारों का यह उल्लास आपके परिवार में खुशहाली और आरोग्य लेकर आए।${promptText}`;
          } else if (aiTone === 'formal') {
            generated = `${fest} के पावन अवसर पर हमारी संस्था की तरफ से बधाई। आपके वित्तीय कल्याण और समृद्धि की मंगलकामना।${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `आपको एवं आपके पूरे परिवार को ${fest} की हार्दिक बधाई। प्रभु की कृपा से आपके घर में सुख, शांति और लक्ष्मी का वास हो।${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `${fest} की शुभकामनाएं! इस पावन पर्व पर बचत और सुरक्षा का संकल्प लें, ताकि भविष्य सदा सुरक्षित रहे।${promptText}`;
          } else {
            generated = `'त्योहारों की यह उमंग लाए अपार खुशियां,\nदुआ है हमारी कि दूर हों सब कठिनाइयां।'\n${fest} की शुभकामनाएं!${promptText}`;
          }
        } else { // Hinglish
          if (aiTone === 'warm') {
            generated = `Aapko aur aapki family ko ${fest} ki bohot badhaai! Yeh festival aapke liye dher saari khushi aur peace lekar aaye.${promptText}`;
          } else if (aiTone === 'formal') {
            generated = `${fest} ki hardik badhaai. Hamari investment team ki taraf se aapko financial security aur wealth badhne ki wishes.${promptText}`;
          } else if (aiTone === 'religious') {
            generated = `Aapko ${fest} ki shubhkaamnaayein! Bhagwan aapke ghar me raddhi-siddhi aur khushhaali pradaan karein.${promptText}`;
          } else if (aiTone === 'financial') {
            generated = `Happy ${fest}! Is subh din par safe investment (SIP/LIC) shuru karne ki thaan lijiye. Future bulletproof hoga.${promptText}`;
          } else {
            generated = `'Khushi ka mauka ho aur apno ka saath,\nFestival mubarak ho aapko din aur raat.'\n${fest} ki badhaai!${promptText}`;
          }
        }
      } else { // marketing
        const topic = marketingPosts.find((p) => p.id === selectedMarketing)?.name || 'Financial Planning';
        if (aiLang === 'en') {
          generated = `Dear Client,\n\n🛡️ Financial Tip: '${topic}' is not a cost, it is your family's shield. Plan early, save regularly, and sleep peacefully knowing your loved ones are safe.${promptText}`;
        } else if (aiLang === 'hi') {
          generated = `प्रिय ग्राहक,\n\n🛡️ वित्तीय मंत्र: '${topic}' केवल निवेश नहीं बल्कि आपके परिवार का सुरक्षा कवच है। आज ही समझदारी से सही योजना चुनें और भविष्य को सुरक्षित करें।${promptText}`;
        } else {
          generated = `Dear Client,\n\n🛡️ Financial Tip: '${topic}' koi kharch nahi balki aapki family ki safety shield hai. Aaj hi simple savings shuru karein aur compounding ka jaadu dekhein!${promptText}`;
        }
      }

      setCustomMsg(generated);
    }, 600);
  };

  const handleCopyText = () => {
    const greetingText = getGreetingText();
    const shareText = `${greetingText}\n\nGreetings from:\n*${advisorProfile.name}*\n${advisorProfile.company}\n📞 ${advisorProfile.phone}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppShareUrl = () => {
    const greetingText = getGreetingText();
    const shareText = `${greetingText}\n\nGreetings from:\n*${advisorProfile.name}*\n${advisorProfile.company}\n📞 ${advisorProfile.phone}`;
    if (selectedClient && client) {
      return `https://api.whatsapp.com/send?phone=${formatPhoneForWhatsapp(client.phone)}&text=${encodeURIComponent(shareText)}`;
    }
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  };

  // Occasion Specific Style Generator
  const getOccasionStyle = () => {
    if (postType === 'birthday') {
      return {
        bg: 'from-slate-950 via-indigo-950 to-slate-950',
        border: 'border-2 border-yellow-500/25',
        cornerFlourish: '🎈',
        accentColor: 'text-amber-400',
        title: 'Happy Birthday',
        headerFont: 'font-cursive',
        bannerDivider: '❃  ════  ❃',
        glowShadow: 'shadow-[0_0_50px_-12px_rgba(56,189,248,0.15)]',
        bgImage: '/greetings/birthday.png',
      };
    }
    if (postType === 'anniversary') {
      return {
        bg: 'from-rose-950 via-pink-950 to-slate-950',
        border: 'border-2 border-pink-500/30',
        cornerFlourish: '🌹',
        accentColor: 'text-rose-400',
        title: 'Happy Anniversary',
        headerFont: 'font-cursive',
        bannerDivider: '❦  ════  ❦',
        glowShadow: 'shadow-[0_0_50px_-12px_rgba(244,63,94,0.15)]',
        bgImage: '/greetings/anniversary.png',
      };
    }
    if (postType === 'festival') {
      switch (selectedFestival) {
        case 'diwali':
          return {
            bg: 'from-amber-950 via-red-950 to-amber-950',
            border: 'border-2 border-yellow-500/40',
            cornerFlourish: '🪔',
            accentColor: 'text-yellow-400',
            title: 'Shubh Deepavali',
            headerFont: 'font-cinzel',
            bannerDivider: '✨  ═══ 🪔 ═══  ✨',
            glowShadow: 'shadow-[0_0_50px_-12px_rgba(234,179,8,0.25)]',
            bgImage: '/greetings/diwali.png',
          };
        case 'holi':
          return {
            bg: 'from-pink-950/80 via-purple-950 to-slate-950',
            border: 'border-2 border-pink-500/40',
            cornerFlourish: '🎨',
            accentColor: 'text-pink-400',
            title: 'Happy Holi',
            headerFont: 'font-cursive',
            bannerDivider: '🌸  ════  🌸',
            glowShadow: 'shadow-[0_0_50px_-12px_rgba(236,72,153,0.25)]',
            bgImage: '/greetings/holi.png',
          };
        case 'eid':
          return {
            bg: 'from-emerald-950 via-teal-950 to-slate-950',
            border: 'border-2 border-yellow-500/30',
            cornerFlourish: '⭐',
            accentColor: 'text-emerald-400',
            title: 'Eid Mubarak',
            headerFont: 'font-cinzel',
            bannerDivider: '🌙  ═══ ⭐ ═══  🌙',
            glowShadow: 'shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)]',
            bgImage: '/greetings/eid.png',
          };
        case 'newyear':
          return {
            bg: 'from-slate-950 via-slate-900 to-slate-950',
            border: 'border-2 border-yellow-500/20',
            cornerFlourish: '✨',
            accentColor: 'text-yellow-400',
            title: 'Happy New Year',
            headerFont: 'font-cinzel',
            bannerDivider: '✨  ════  ✨',
            glowShadow: 'shadow-[0_0_50px_-12px_rgba(250,204,21,0.15)]',
            bgImage: '/greetings/newyear.png',
          };
        case 'indday':
          return {
            bg: 'from-orange-950/30 via-slate-950 to-emerald-950/30',
            border: 'border-2 border-sky-500/25',
            cornerFlourish: '☸️',
            accentColor: 'text-sky-400',
            title: 'Independence Day',
            headerFont: 'font-cinzel',
            bannerDivider: '🧡  ═══ ☸️ ═══  💚',
            glowShadow: 'shadow-[0_0_50px_-12px_rgba(56,189,248,0.15)]',
            bgImage: '/greetings/indday.png',
          };
        default:
          return {
            bg: 'from-slate-950 via-slate-900 to-slate-950',
            border: 'border-2 border-red-500/30',
            cornerFlourish: '❄️',
            accentColor: 'text-red-400',
            title: 'Merry Christmas',
            headerFont: 'font-cursive',
            bannerDivider: '❄️  ════  ❄️',
            glowShadow: 'shadow-[0_0_50px_-12px_rgba(245,158,11,0.15)]',
            bgImage: '/greetings/christmas.png',
          };
      }
    }
    // Marketing templates
    switch (selectedMarketing) {
      case 'sip':
        return {
          bg: 'from-slate-950 via-indigo-950 to-slate-950',
          border: 'border-2 border-indigo-500/30',
          cornerFlourish: '📈',
          accentColor: 'text-indigo-400',
          title: 'Wealth Creation',
          headerFont: 'font-cinzel',
          bannerDivider: '🚀  ════  🚀',
          glowShadow: 'shadow-[0_0_50px_-12px_rgba(99,102,241,0.25)]',
          bgImage: '/greetings/sip.png',
        };
      case 'health':
        return {
          bg: 'from-slate-950 via-teal-950 to-slate-950',
          border: 'border-2 border-teal-500/30',
          cornerFlourish: '🛡️',
          accentColor: 'text-teal-400',
          title: 'Health Protection',
          headerFont: 'font-cinzel',
          bannerDivider: '🏥  ════  🏥',
          glowShadow: 'shadow-[0_0_50px_-12px_rgba(20,184,166,0.25)]',
          bgImage: '/greetings/health.png',
        };
      default:
        return {
          bg: 'from-slate-950 via-slate-900 to-slate-950',
          border: 'border-2 border-yellow-500/20',
          cornerFlourish: '🛡️',
          accentColor: 'text-yellow-400',
          title: 'Family Security',
          headerFont: 'font-cinzel',
          bannerDivider: '🛡️  ════  🛡️',
          glowShadow: 'shadow-[0_0_50px_-12px_rgba(234,179,8,0.15)]',
          bgImage: '/greetings/life.png',
        };
    }
  };

  const style = getOccasionStyle();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Google fonts loader inside standard HTML style block */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@500;700;800&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap');
        .font-cursive { font-family: 'Great Vibes', cursive; }
        .font-serif-card { font-family: 'Playfair Display', serif; }
        .font-cinzel { font-family: 'Cinzel', serif; }
      `}} />

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold">Greetings & Social Media Posts</h1>
          <p className="text-sm text-slate-400 mt-1">Generate premium co-branded greeting cards for your clients with standard designs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-5 card p-5 space-y-5 no-print">
          <div>
            <label className="label text-xs">Select Greeting Type</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button 
                onClick={() => { setPostType('birthday'); setCustomMsg(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  postType === 'birthday' ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Gift size={14} />
                Birthday
              </button>
              <button 
                onClick={() => { setPostType('anniversary'); setCustomMsg(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  postType === 'anniversary' ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Heart size={14} />
                Anniversary
              </button>
              <button 
                onClick={() => { setPostType('festival'); setCustomMsg(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  postType === 'festival' ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Calendar size={14} />
                Festivals
              </button>
              <button 
                onClick={() => { setPostType('marketing'); setCustomMsg(''); }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  postType === 'marketing' ? 'bg-yellow-500 border-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} />
                Marketing SIP/LIC
              </button>
            </div>
          </div>

          {/* Conditional Selectors */}
          {(postType === 'birthday' || postType === 'anniversary') && (
            <div>
              <label className="label text-xs">Select Target Client</label>
              <select 
                className="input text-xs mt-1.5"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Choose a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getFullName(c.firstName, c.lastName)} ({postType === 'birthday' ? 'DOB: ' + formatDate(c.dob) : 'Anniversary'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {postType === 'festival' && (
            <div>
              <label className="label text-xs">Select Festival Theme</label>
              <select 
                className="input text-xs mt-1.5"
                value={selectedFestival}
                onChange={(e) => setSelectedFestival(e.target.value)}
              >
                {festivals.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          {postType === 'marketing' && (
            <div>
              <label className="label text-xs">Select awareness theme</label>
              <select 
                className="input text-xs mt-1.5"
                value={selectedMarketing}
                onChange={(e) => setSelectedMarketing(e.target.value)}
              >
                {marketingPosts.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Style Customizations */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Style Options</h4>
            
            <div className="flex gap-4">
              <div className="flex-1 flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-300 font-medium">Translate to Hindi (हिंदी)</span>
                <button 
                  onClick={() => setUseHindi(!useHindi)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${useHindi ? 'bg-yellow-500' : 'bg-slate-800'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${useHindi ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>

              {style.bgImage && (
                <div className="flex-1 flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                  <span className="text-xs text-slate-300 font-medium">Card Illustration</span>
                  <button 
                    onClick={() => setShowIllustration(!showIllustration)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${showIllustration ? 'bg-yellow-500' : 'bg-slate-800'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showIllustration ? 'left-5.5' : 'left-0.5'}`} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="label text-xs">Edit Greeting Message Manually</label>
              <textarea 
                className="input min-h-[110px] text-xs leading-relaxed mt-1.5 font-mono" 
                value={getGreetingText()}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Write custom greeting message here..."
              />
            </div>
          </div>

          {/* AI Saarthi Greetings Writer */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-yellow-400" />
                AI Saarthi Greeting Writer
              </h4>
              <button 
                onClick={() => { setCustomMsg(''); setAiPrompt(''); }}
                className="text-[10px] text-yellow-500/70 hover:text-yellow-400 underline font-semibold transition-all"
              >
                Reset Default
              </button>
            </div>

            <div className="space-y-2 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase">Language</label>
                  <select 
                    className="input text-[11px] h-8 py-0.5 px-2 mt-1" 
                    value={aiLang} 
                    onChange={(e) => setAiLang(e.target.value as 'en' | 'hi' | 'hinglish')}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 font-bold uppercase">Select Tone</label>
                  <select 
                    className="input text-[11px] h-8 py-0.5 px-2 mt-1" 
                    value={aiTone} 
                    onChange={(e) => setAiTone(e.target.value as 'warm' | 'formal' | 'religious' | 'financial' | 'poetic')}
                  >
                    <option value="warm">Warm / Emotional</option>
                    <option value="formal">Formal / Business</option>
                    <option value="religious">Traditional / Blessings</option>
                    <option value="financial">Financial Wisdom</option>
                    <option value="poetic">Poetic / Shayari</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-bold uppercase">Custom Prompt / Keyword</label>
                <input 
                  type="text" 
                  placeholder="e.g. Wish health, success in new project, etc." 
                  className="input text-[11px] h-8 py-1 mt-1"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
              </div>

              <button 
                onClick={handleGenerateAIGreeting}
                disabled={isGenerating}
                className="w-full btn btn-primary py-2 px-3 text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-yellow-500/10"
              >
                {isGenerating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Writing Custom Greeting...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-slate-950" />
                    Write with AI Saarthi
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Edit Branding Details */}
          <div className="border-t border-slate-800/80 pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Poster Branding Details</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="label text-[10px] text-slate-500 uppercase font-bold">Advisor Name</label>
                <input 
                  className="input text-xs py-1 px-2.5 h-8 mt-1" 
                  value={advisorProfile.name} 
                  onChange={(e) => {
                    const newProfile = { ...advisorProfile, name: e.target.value };
                    setAdvisorProfile(newProfile);
                    const saved = localStorage.getItem('ak_advisor_profile') ? JSON.parse(localStorage.getItem('ak_advisor_profile')!) : {};
                    saved.name = e.target.value;
                    localStorage.setItem('ak_advisor_profile', JSON.stringify(saved));
                  }} 
                />
              </div>
              <div>
                <label className="label text-[10px] text-slate-500 uppercase font-bold">Phone Number</label>
                <input 
                  className="input text-xs py-1.5 px-2.5 h-8 mt-1" 
                  value={advisorProfile.phone} 
                  onChange={(e) => {
                    const newProfile = { ...advisorProfile, phone: e.target.value };
                    setAdvisorProfile(newProfile);
                    const saved = localStorage.getItem('ak_advisor_profile') ? JSON.parse(localStorage.getItem('ak_advisor_profile')!) : {};
                    saved.phone = e.target.value;
                    localStorage.setItem('ak_advisor_profile', JSON.stringify(saved));
                  }} 
                />
              </div>
              <div className="col-span-2">
                <label className="label text-[10px] text-slate-500 uppercase font-bold">Company / Services</label>
                <input 
                  className="input text-xs py-1.5 px-2.5 h-8 mt-1" 
                  value={advisorProfile.company} 
                  onChange={(e) => {
                    const newProfile = { ...advisorProfile, company: e.target.value };
                    setAdvisorProfile(newProfile);
                    const saved = localStorage.getItem('ak_advisor_profile') ? JSON.parse(localStorage.getItem('ak_advisor_profile')!) : {};
                    saved.company = e.target.value;
                    localStorage.setItem('ak_advisor_profile', JSON.stringify(saved));
                  }} 
                />
              </div>
              <div className="col-span-2">
                <label className="label text-[10px] text-slate-500 uppercase font-bold">License / ARN Details</label>
                <input 
                  className="input text-xs py-1.5 px-2.5 h-8 mt-1" 
                  value={advisorProfile.license} 
                  onChange={(e) => {
                    const newProfile = { ...advisorProfile, license: e.target.value };
                    setAdvisorProfile(newProfile);
                    const parts = e.target.value.split('|');
                    const arn = parts[0]?.trim() || '';
                    const lic = parts[1]?.trim() || '';
                    const saved = localStorage.getItem('ak_advisor_profile') ? JSON.parse(localStorage.getItem('ak_advisor_profile')!) : {};
                    saved.arnNumber = arn;
                    saved.licenseNumber = lic;
                    localStorage.setItem('ak_advisor_profile', JSON.stringify(saved));
                  }} 
                />
              </div>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex gap-2 border-t border-slate-800 pt-4 w-full">
            <button 
              onClick={handlePrint}
              className="flex-1 btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button 
              onClick={handleCopyText}
              className="flex-1 btn btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
              {copied ? 'Copied' : 'Copy Share Text'}
            </button>
            <a 
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 btn btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
            >
              <Send size={14} />
              Send WhatsApp
            </a>
          </div>
        </div>

        {/* Poster Canvas Preview Column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="text-center mb-3 no-print">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Live Poster Canvas Preview</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Use &quot;Print / Save PDF&quot; to download this card as an image/PDF.</p>
          </div>

          {/* Standard Greeting Card Canvas */}
          <div 
            id="greeting-poster"
            className={`w-[480px] h-[480px] rounded-[32px] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all bg-gradient-to-b ${style.bg} ${style.glowShadow}`}
            style={{ border: '12px solid rgba(217, 119, 6, 0.15)' }}
          >
            {/* Background Image Illustration layer with overlay */}
            {style.bgImage && showIllustration && (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center z-0 scale-105"
                  style={{ backgroundImage: `url(${style.bgImage})` }}
                />
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] z-0" />
              </>
            )}

            {/* Elegant Double Border Frame */}
            <div className={`absolute inset-2.5 rounded-[22px] border ${style.border} pointer-events-none z-10`} />
            <div className={`absolute inset-3.5 rounded-[20px] border border-double border-yellow-500/10 pointer-events-none z-10`} />

            {/* Corner Flourish Ornaments */}
            <div className="absolute top-5 left-5 text-base select-none opacity-40 z-10">{style.cornerFlourish}</div>
            <div className="absolute top-5 right-5 text-base select-none opacity-40 z-10">{style.cornerFlourish}</div>
            <div className="absolute bottom-20 left-5 text-base select-none opacity-40 z-10">{style.cornerFlourish}</div>
            <div className="absolute bottom-20 right-5 text-base select-none opacity-40 z-10">{style.cornerFlourish}</div>

            {/* Glowing background highlights */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-44 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none z-0" />

            {/* Frosted Layered Paper Card (Standard Greeting Card Centerpiece) */}
            <div className="w-[90%] h-[68%] mx-auto my-auto bg-slate-950/75 border border-yellow-500/10 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative z-10 backdrop-blur-md">
              
              {/* Header section with Cursive/Cinzel font */}
              <div className="text-center space-y-1">
                <h3 className={`text-4xl font-normal leading-none tracking-wide text-yellow-400 ${style.headerFont}`}>
                  {style.title}
                </h3>
                <p className="text-[9px] text-slate-500 tracking-[0.25em] font-mono leading-none select-none uppercase mt-1">
                  {style.bannerDivider}
                </p>
              </div>

              {/* Message block with Playfair Display serif font */}
              <div className="text-center my-auto px-2">
                <p className="text-[15px] font-medium leading-relaxed text-amber-100/90 italic font-serif-card whitespace-pre-line drop-shadow-sm">
                  {getGreetingText()}
                </p>
              </div>

              {/* Flourish signature dot */}
              <div className="text-center text-[10px] text-yellow-500/40 select-none">✦ ❖ ✦</div>
            </div>

            {/* Premium signature branding bar at the bottom */}
            <div className="relative z-10 w-[96%] mx-auto bg-gradient-to-r from-yellow-600/15 via-yellow-500/5 to-yellow-600/15 border border-yellow-500/10 py-2.5 px-4 rounded-xl flex items-center justify-between gap-4 backdrop-blur-sm">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-200 tracking-wide">{advisorProfile.name}</p>
                <p className="text-[8px] text-slate-400 font-semibold">{advisorProfile.company}</p>
                <p className="text-[7px] text-slate-500 font-mono tracking-wider">{advisorProfile.license}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[9px] font-bold text-yellow-400 flex items-center justify-end gap-1">
                  <Phone size={8} className="shrink-0" />
                  {advisorProfile.phone}
                </p>
                <p className="text-[8px] text-slate-400 font-mono flex items-center justify-end gap-1">
                  <Mail size={8} className="shrink-0" />
                  {advisorProfile.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
