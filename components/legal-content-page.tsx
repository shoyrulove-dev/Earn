"use client";

import { useEffect, useState } from "react";

type Locale = "en" | "vi" | "zh" | "es";
type Kind = "terms" | "privacy" | "faq" | "support";
type Section = { title: string; text: string };
type PageCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
};

const labels = {
  en: {
    home: "Home",
    terms: "Terms",
    privacy: "Privacy",
    faq: "FAQ",
    support: "Support",
  },
  vi: {
    home: "Trang chủ",
    terms: "Điều khoản",
    privacy: "Bảo mật",
    faq: "Câu hỏi",
    support: "Hỗ trợ",
  },
  zh: {
    home: "首页",
    terms: "条款",
    privacy: "隐私",
    faq: "常见问题",
    support: "支持",
  },
  es: {
    home: "Inicio",
    terms: "Términos",
    privacy: "Privacidad",
    faq: "Preguntas",
    support: "Soporte",
  },
};

const content: Record<Locale, Record<Kind, PageCopy>> = {
  en: {
    terms: {
      eyebrow: "PURE EARN · TERMS",
      title: "Offerwall rules & reward terms",
      intro:
        "PHT is an internal off-chain reward point, not a blockchain token, investment, deposit or promise of profit. 1,000 PHT uses an internal reference value of 1 USD.",
      sections: [
        {
          title: "Fair participation",
          text: "One account per person and device. VPNs, proxies, emulators, automated traffic, fake identities, another person's KYC and duplicate partner accounts are prohibited. Partner validation determines reward eligibility.",
        },
        {
          title: "Pending rewards",
          text: "Rewards may remain pending, be rejected or reversed if the partner cancels a conversion. Screenshots are supporting evidence, not a payment guarantee.",
        },
        {
          title: "Safety",
          text: "Never submit passwords, OTP codes, seed phrases, private keys or full identity documents. Pure Earn may suspend abusive accounts and retain dispute records.",
        },
      ],
    },
    privacy: {
      eyebrow: "PURE EARN · PRIVACY",
      title: "Privacy Policy",
      intro:
        "Pure Earn processes only information needed to operate accounts, validate offers, prevent fraud and process withdrawals.",
      sections: [
        {
          title: "Information we collect",
          text: "Account identity, country, language, member ID, reward history, payout details, click identifiers, proof links, device identifiers and security logs.",
        },
        {
          title: "Use and sharing",
          text: "We use data for authentication, localization, attribution, PHT calculations, disputes and fraud prevention. Tracking identifiers may be sent to offer partners. We do not sell personal information.",
        },
        {
          title: "Your choices",
          text: "Request correction or deletion, subject to anti-fraud, accounting and legal retention, at admin@blissbiovn.com.",
        },
      ],
    },
    faq: {
      eyebrow: "PURE EARN · HELP",
      title: "Frequently Asked Questions",
      intro: "Quick answers about PHT, offers and withdrawals.",
      sections: [
        {
          title: "What is PHT?",
          text: "PHT is an internal off-chain reward point. 1,000 PHT uses an internal reference value of 1 USD.",
        },
        {
          title: "Why is my reward pending?",
          text: "The partner must validate eligibility and check cancellations or fraud.",
        },
        {
          title: "What is the minimum withdrawal?",
          text: "Withdrawals start at 5,000 PHT. Fees depend on your member tier.",
        },
        {
          title: "What if tracking is missing?",
          text: "Submit proof inside Offers using a safe screenshot URL and masked contact details.",
        },
        {
          title: "Which payouts are supported?",
          text: "Vietnam supports bank transfer, MoMo and USDT BSC. Other countries support USDT BSC.",
        },
      ],
    },
    support: {
      eyebrow: "PURE EARN · SUPPORT",
      title: "Support & disputes",
      intro:
        "Keep your member ID, campaign name, click time and a safe screenshot link ready.",
      sections: [
        {
          title: "Missing conversion",
          text: "Use the proof form inside Offers first and allow normal tracking time before opening another request.",
        },
        {
          title: "Withdrawal dispute",
          text: "Include withdrawal date, method and status. Never send passwords, OTP, seed phrases, private keys or unmasked identity documents.",
        },
        {
          title: "Contact",
          text: "Email admin@blissbiovn.com. Target response time is two business days.",
        },
      ],
    },
  },
  vi: {
    terms: {
      eyebrow: "PURE EARN · ĐIỀU KHOẢN",
      title: "Quy định Offerwall và điều khoản thưởng",
      intro:
        "PHT là điểm thưởng nội bộ ngoài blockchain, không phải token blockchain, sản phẩm đầu tư, tiền gửi hay cam kết lợi nhuận. 1.000 PHT có giá trị tham chiếu nội bộ là 1 USD.",
      sections: [
        {
          title: "Tham gia công bằng",
          text: "Mỗi người và thiết bị chỉ dùng một tài khoản. Cấm VPN, proxy, máy ảo, traffic tự động, danh tính giả, KYC của người khác và tài khoản đối tác trùng. Kết quả xác minh của đối tác quyết định điều kiện nhận thưởng.",
        },
        {
          title: "Phần thưởng chờ duyệt",
          text: "Phần thưởng có thể chờ, bị từ chối hoặc thu hồi nếu đối tác hủy chuyển đổi. Ảnh chụp chỉ là bằng chứng hỗ trợ, không bảo đảm thanh toán.",
        },
        {
          title: "An toàn",
          text: "Không gửi mật khẩu, OTP, cụm từ khôi phục, khóa riêng hoặc giấy tờ đầy đủ. Pure Earn có thể đình chỉ tài khoản lạm dụng và lưu hồ sơ khiếu nại.",
        },
      ],
    },
    privacy: {
      eyebrow: "PURE EARN · BẢO MẬT",
      title: "Chính sách bảo mật",
      intro:
        "Pure Earn chỉ xử lý dữ liệu cần thiết để vận hành tài khoản, xác minh ưu đãi, chống gian lận và xử lý rút thưởng.",
      sections: [
        {
          title: "Thông tin thu thập",
          text: "Thông tin tài khoản, quốc gia, ngôn ngữ, mã thành viên, lịch sử thưởng, thông tin nhận tiền, mã click, liên kết bằng chứng, mã thiết bị và nhật ký bảo mật.",
        },
        {
          title: "Sử dụng và chia sẻ",
          text: "Dữ liệu phục vụ xác thực, bản địa hóa, ghi nhận chuyển đổi, tính PHT, xử lý khiếu nại và chống gian lận. Mã tracking có thể gửi cho đối tác. Chúng tôi không bán dữ liệu cá nhân.",
        },
        {
          title: "Quyền của bạn",
          text: "Yêu cầu chỉnh sửa hoặc xóa dữ liệu, tùy nghĩa vụ lưu trữ chống gian lận, kế toán và pháp lý, qua admin@blissbiovn.com.",
        },
      ],
    },
    faq: {
      eyebrow: "PURE EARN · TRỢ GIÚP",
      title: "Câu hỏi thường gặp",
      intro: "Giải đáp nhanh về PHT, nhiệm vụ và rút thưởng.",
      sections: [
        {
          title: "PHT là gì?",
          text: "PHT là điểm thưởng nội bộ ngoài blockchain. 1.000 PHT có giá trị tham chiếu nội bộ là 1 USD.",
        },
        {
          title: "Vì sao phần thưởng đang chờ?",
          text: "Đối tác cần xác minh điều kiện, đơn hủy và dấu hiệu gian lận trước khi duyệt.",
        },
        {
          title: "Mức rút tối thiểu là bao nhiêu?",
          text: "Mức rút tối thiểu là 5.000 PHT. Phí phụ thuộc cấp thành viên.",
        },
        {
          title: "Nếu mất tracking thì sao?",
          text: "Nộp bằng chứng trong Nhiệm vụ bằng liên kết ảnh an toàn và thông tin liên hệ đã che bớt.",
        },
        {
          title: "Hỗ trợ rút bằng cách nào?",
          text: "Việt Nam hỗ trợ ngân hàng, MoMo và USDT BSC. Quốc gia khác hỗ trợ USDT BSC.",
        },
      ],
    },
    support: {
      eyebrow: "PURE EARN · HỖ TRỢ",
      title: "Hỗ trợ và khiếu nại",
      intro:
        "Hãy chuẩn bị mã thành viên, tên chiến dịch, thời gian click và liên kết ảnh chụp an toàn.",
      sections: [
        {
          title: "Không ghi nhận chuyển đổi",
          text: "Trước tiên dùng biểu mẫu bằng chứng trong Nhiệm vụ và chờ đủ thời gian tracking thông thường trước khi gửi yêu cầu khác.",
        },
        {
          title: "Khiếu nại rút thưởng",
          text: "Cung cấp ngày rút, phương thức và trạng thái. Không gửi mật khẩu, OTP, cụm từ khôi phục, khóa riêng hoặc giấy tờ chưa che thông tin.",
        },
        {
          title: "Liên hệ",
          text: "Email admin@blissbiovn.com. Thời gian phản hồi dự kiến trong vòng hai ngày làm việc.",
        },
      ],
    },
  },
  zh: {
    terms: {
      eyebrow: "PURE EARN · 条款",
      title: "Offerwall 规则与奖励条款",
      intro:
        "PHT 是平台内部的链下奖励积分，不是区块链代币、投资、存款或收益承诺。1,000 PHT 的内部参考价值为 1 美元。",
      sections: [
        {
          title: "公平参与",
          text: "每人及每台设备仅限一个账户。禁止 VPN、代理、模拟器、自动流量、虚假身份、他人 KYC 和重复合作伙伴账户。合作伙伴验证结果决定奖励资格。",
        },
        {
          title: "待处理奖励",
          text: "若合作伙伴取消转化，奖励可能待处理、被拒绝或撤销。截图仅作为辅助证据。",
        },
        {
          title: "安全",
          text: "请勿提交密码、OTP、助记词、私钥或完整身份证件。Pure Earn 可暂停滥用账户并保留争议记录。",
        },
      ],
    },
    privacy: {
      eyebrow: "PURE EARN · 隐私",
      title: "隐私政策",
      intro:
        "Pure Earn 仅处理运营账户、验证优惠、防止欺诈和处理提现所需的信息。",
      sections: [
        {
          title: "收集的信息",
          text: "账户身份、国家、语言、会员编号、奖励历史、提现资料、点击标识、证明链接、设备标识和安全日志。",
        },
        {
          title: "使用与共享",
          text: "数据用于验证、本地化、转化归因、PHT 计算、争议和反欺诈。跟踪标识可能发送给合作伙伴。我们不出售个人信息。",
        },
        {
          title: "您的选择",
          text: "可通过 admin@blissbiovn.com 请求更正或删除，但须遵守反欺诈、会计和法律保留要求。",
        },
      ],
    },
    faq: {
      eyebrow: "PURE EARN · 帮助",
      title: "常见问题",
      intro: "关于 PHT、任务和提现的快速解答。",
      sections: [
        {
          title: "什么是 PHT？",
          text: "PHT 是内部链下奖励积分，1,000 PHT 的内部参考价值为 1 美元。",
        },
        {
          title: "为什么奖励待处理？",
          text: "合作伙伴需验证资格并检查取消或欺诈情况。",
        },
        {
          title: "最低提现是多少？",
          text: "最低提现为 5,000 PHT，费用取决于会员等级。",
        },
        {
          title: "跟踪丢失怎么办？",
          text: "请在任务页面提交安全的截图链接和经过遮盖的联系信息。",
        },
        {
          title: "支持哪些提现方式？",
          text: "越南支持银行转账、MoMo 和 USDT BSC；其他国家支持 USDT BSC。",
        },
      ],
    },
    support: {
      eyebrow: "PURE EARN · 支持",
      title: "支持与争议",
      intro: "请准备会员编号、活动名称、点击时间和安全的截图链接。",
      sections: [
        {
          title: "转化未记录",
          text: "请先使用任务中的证明表单，并等待正常跟踪时间后再提交其他请求。",
        },
        {
          title: "提现争议",
          text: "请提供提现日期、方式和状态。切勿发送密码、OTP、助记词、私钥或未遮盖的身份证件。",
        },
        {
          title: "联系",
          text: "发送邮件至 admin@blissbiovn.com，预计两个工作日内回复。",
        },
      ],
    },
  },
  es: {
    terms: {
      eyebrow: "PURE EARN · TÉRMINOS",
      title: "Reglas del Offerwall y recompensas",
      intro:
        "PHT es un punto interno fuera de la blockchain; no es un token, inversión, depósito ni promesa de beneficios. 1.000 PHT tienen un valor interno de referencia de 1 USD.",
      sections: [
        {
          title: "Participación justa",
          text: "Una cuenta por persona y dispositivo. Se prohíben VPN, proxys, emuladores, tráfico automatizado, identidades falsas, KYC ajeno y cuentas duplicadas. La validación del socio determina la recompensa.",
        },
        {
          title: "Recompensas pendientes",
          text: "La recompensa puede quedar pendiente, rechazarse o revertirse si el socio cancela la conversión. Las capturas son solo evidencia de apoyo.",
        },
        {
          title: "Seguridad",
          text: "Nunca envíes contraseñas, OTP, frases semilla, claves privadas ni documentos completos. Pure Earn puede suspender cuentas abusivas.",
        },
      ],
    },
    privacy: {
      eyebrow: "PURE EARN · PRIVACIDAD",
      title: "Política de privacidad",
      intro:
        "Pure Earn solo trata la información necesaria para operar cuentas, validar ofertas, prevenir fraude y procesar retiros.",
      sections: [
        {
          title: "Información recopilada",
          text: "Identidad, país, idioma, ID de miembro, historial, datos de retiro, clics, enlaces de pruebas, dispositivo y registros de seguridad.",
        },
        {
          title: "Uso y divulgación",
          text: "Los datos sirven para autenticar, localizar, atribuir conversiones, calcular PHT, gestionar disputas y prevenir fraude. No vendemos información personal.",
        },
        {
          title: "Tus opciones",
          text: "Solicita corrección o eliminación, sujeta a obligaciones antifraude, contables y legales, en admin@blissbiovn.com.",
        },
      ],
    },
    faq: {
      eyebrow: "PURE EARN · AYUDA",
      title: "Preguntas frecuentes",
      intro: "Respuestas rápidas sobre PHT, tareas y retiros.",
      sections: [
        {
          title: "¿Qué es PHT?",
          text: "PHT es un punto interno fuera de la blockchain. 1.000 PHT tienen un valor de referencia de 1 USD.",
        },
        {
          title: "¿Por qué está pendiente mi recompensa?",
          text: "El socio debe validar la elegibilidad y comprobar cancelaciones o fraude.",
        },
        {
          title: "¿Cuál es el retiro mínimo?",
          text: "Los retiros comienzan en 5.000 PHT y la comisión depende del nivel.",
        },
        {
          title: "¿Qué pasa si falla el seguimiento?",
          text: "Envía una prueba desde Tareas con un enlace seguro y datos ocultos.",
        },
        {
          title: "¿Qué retiros se admiten?",
          text: "Vietnam admite banco, MoMo y USDT BSC; otros países admiten USDT BSC.",
        },
      ],
    },
    support: {
      eyebrow: "PURE EARN · SOPORTE",
      title: "Soporte y disputas",
      intro:
        "Ten preparados tu ID de miembro, campaña, hora del clic y un enlace seguro a la captura.",
      sections: [
        {
          title: "Conversión no registrada",
          text: "Usa primero el formulario de prueba en Tareas y espera el tiempo normal de seguimiento.",
        },
        {
          title: "Disputa de retiro",
          text: "Incluye fecha, método y estado. Nunca envíes contraseñas, OTP, frases semilla, claves privadas ni documentos sin ocultar.",
        },
        {
          title: "Contacto",
          text: "Escribe a admin@blissbiovn.com. El plazo previsto es de dos días laborables.",
        },
      ],
    },
  },
};

export default function LegalContentPage({ kind }: { kind: Kind }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const saved = localStorage.getItem("pureearn_locale") as Locale | null;
    if (saved && saved in labels) setLocale(saved);
  }, []);
  function change(next: Locale) {
    setLocale(next);
    localStorage.setItem("pureearn_locale", next);
    document.documentElement.lang = next;
    window.dispatchEvent(new CustomEvent("pureearn:locale", { detail: next }));
  }
  const page = content[locale][kind];
  const n = labels[locale];
  return (
    <main className="legal">
      <article>
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{page.eyebrow}</p>
          <select
            aria-label="Language"
            value={locale}
            onChange={(e) => change(e.target.value as Locale)}
            className="rounded-lg border border-white/10 bg-[#34244f] px-3 py-2 text-xs text-white"
          >
            <option value="en">EN</option>
            <option value="vi">VI</option>
            <option value="zh">中文</option>
            <option value="es">ES</option>
          </select>
        </div>
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        {page.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
        <nav className="legal-nav">
          <a href="/">{n.home}</a>
          <a href="/terms">{n.terms}</a>
          <a href="/privacy">{n.privacy}</a>
          <a href="/faq">{n.faq}</a>
          <a href="/support">{n.support}</a>
        </nav>
      </article>
    </main>
  );
}
