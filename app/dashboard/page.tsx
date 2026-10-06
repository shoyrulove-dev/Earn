"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { countryOptions, normalizeCountry } from "@/lib/countries";
import Turnstile from "@/components/Turnstile";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Gift,
  Globe2,
  History,
  Home,
  Languages,
  LayoutGrid,
  LogOut,
  Menu,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";

type Locale = "en" | "vi" | "zh" | "es";
type Screen =
  | "Home"
  | "Offers"
  | "Wallet"
  | "Profile"
  | "Referrals"
  | "History"
  | "Guide"
  | "Leaderboard";
type User = {
  name?: string;
  userId?: string;
  username?: string;
  email?: string;
  image?: string;
  country?: string;
  countryName?: string;
  locale?: Locale;
  phtBalance?: number;
  usdBalance?: number;
  pendingPht?: number;
  totalEarnedPht?: number;
  vipLevel?: "bronze" | "silver" | "gold" | "diamond";
  checkinStreak?: number;
  lastCheckinAt?: string;
  role?: string;
  referralCode?: string;
  referralEarnings?: number;
  createdAt?: string;
};
type Job = {
  _id: string;
  title: string;
  description?: string;
  reward: number;
  rewardCurrency?: "USD" | "PHT";
  source?: string;
  tags?: string[];
  icon?: string;
  externalUrl?: string;
};
type Campaign = {
  campaign_id: string;
  name: string;
  logo?: string;
  max_commission?: number;
  min_commission?: number;
  commission_type?: string;
  merchant?: string;
  url?: string;
  description?: string;
  campaign_type?: string;
  estimated_reward_pht?: number;
  hold_days?: number;
  reward_note?: string;
  instructions?: string[];
};
type Tx = {
  _id: string;
  type: string;
  currency?: "PHT" | "USD";
  amount: number;
  status: string;
  source?: string;
  createdAt: string;
  metadata?: { feePht?: number; netPht?: number };
};
type Referral = {
  _id: string;
  name?: string;
  username?: string;
  createdAt: string;
};
type Leader = {
  userId: string;
  name?: string;
  username?: string;
  image?: string;
  pht: number;
};

const offerDetailCopy = {
  en: {
    estimated: "Estimated reward",
    validation: "After validation",
    pending: "Pending period",
    days: "days",
    rewardNote:
      "The reward is calculated after AccessTrade confirms a valid conversion.",
    howTo: "How to complete",
    steps: (name: string, days: number) => [
      `Open ${name} from Pure Earn and continue on the same browser and device.`,
      "Read and complete every condition shown by the partner using accurate personal information.",
      "Only new eligible customers qualify. Do not use a VPN, emulator, duplicate account or false identity.",
      `After AccessTrade confirms the conversion, the reward remains pending for about ${days} days for reconciliation.`,
    ],
    warning:
      "New eligible users only. VPNs, emulators, duplicate accounts and false information are prohibited. The final reward depends on AccessTrade validation.",
    start: "I understand · Start offer",
  },
  vi: {
    estimated: "Thưởng dự kiến",
    validation: "Theo đối soát",
    pending: "Thời gian chờ",
    days: "ngày",
    rewardNote:
      "Phần thưởng được tính sau khi AccessTrade xác nhận chuyển đổi hợp lệ.",
    howTo: "Cách hoàn thành",
    steps: (name: string, days: number) => [
      `Mở ${name} từ Pure Earn và tiếp tục trên cùng trình duyệt, thiết bị.`,
      "Đọc kỹ và hoàn thành mọi điều kiện do đối tác hiển thị bằng thông tin cá nhân chính xác.",
      "Chỉ khách hàng mới đủ điều kiện. Không dùng VPN, máy ảo, tài khoản trùng lặp hoặc thông tin giả.",
      `Sau khi AccessTrade xác nhận chuyển đổi, phần thưởng sẽ chờ khoảng ${days} ngày để đối soát.`,
    ],
    warning:
      "Chỉ người dùng mới đủ điều kiện. Cấm VPN, máy ảo, tài khoản trùng lặp và thông tin giả. Phần thưởng cuối cùng phụ thuộc dữ liệu đối soát AccessTrade.",
    start: "Tôi đã hiểu · Bắt đầu làm",
  },
  zh: {
    estimated: "预计奖励",
    validation: "审核后确定",
    pending: "待审核时间",
    days: "天",
    rewardNote: "AccessTrade 确认转化有效后，系统才会计算奖励。",
    howTo: "完成方式",
    steps: (name: string, days: number) => [
      `从 Pure Earn 打开 ${name}，并始终使用同一浏览器和设备。`,
      "仔细阅读并使用真实、准确的个人信息完成合作方显示的所有条件。",
      "仅限符合条件的新用户。禁止使用 VPN、模拟器、重复账户或虚假身份。",
      `AccessTrade 确认转化后，奖励将等待约 ${days} 天进行核对。`,
    ],
    warning:
      "仅限符合条件的新用户。禁止 VPN、模拟器、重复账户和虚假信息。最终奖励以 AccessTrade 审核结果为准。",
    start: "我已了解 · 开始任务",
  },
  es: {
    estimated: "Recompensa estimada",
    validation: "Tras la validación",
    pending: "Periodo pendiente",
    days: "días",
    rewardNote:
      "La recompensa se calcula cuando AccessTrade confirma una conversión válida.",
    howTo: "Cómo completar",
    steps: (name: string, days: number) => [
      `Abre ${name} desde Pure Earn y continúa en el mismo navegador y dispositivo.`,
      "Lee y completa todas las condiciones del socio con información personal correcta.",
      "Solo califican clientes nuevos elegibles. No uses VPN, emuladores, cuentas duplicadas ni identidades falsas.",
      `Cuando AccessTrade confirme la conversión, la recompensa quedará pendiente unos ${days} días para su conciliación.`,
    ],
    warning:
      "Solo para nuevos usuarios elegibles. Se prohíben VPN, emuladores, cuentas duplicadas e información falsa. La recompensa final depende de la validación de AccessTrade.",
    start: "Entendido · Iniciar oferta",
  },
};

const payoutCopy = {
  en: {
    method: "Payment method",
    bank: "Bank transfer",
    momo: "MoMo wallet",
    usdt: "USDT (BSC)",
    bankName: "Bank name",
    holder: "Account holder",
    account: "Account number",
    phone: "MoMo phone number",
    address: "BSC wallet address (0x…)",
    bscNote: "Use only a USDT deposit address on the BEP20 (BSC) network.",
    guideIntro:
      "Choose a payout method and enter details exactly as shown in the receiving account.",
    guideBank: "Bank transfer",
    guideBankSteps: [
      "Select Bank transfer.",
      "Enter the bank name, account holder and account number exactly as registered.",
      "Review the details before submitting; an incorrect account can delay payment.",
    ],
    guideMomo: "MoMo wallet",
    guideMomoSteps: [
      "Select MoMo wallet.",
      "Enter the verified account holder name and Vietnamese phone number.",
      "Make sure the number can receive MoMo transfers.",
    ],
    guideUsdt: "USDT via BingX (BSC)",
    guideUsdtSteps: [
      "In BingX, open Assets → Deposit → USDT.",
      "Select the BEP20 (BSC) network, then copy the address beginning with 0x.",
      "Paste the address in Pure Earn and verify the first and last characters before submitting.",
    ],
    safety:
      "Never submit an OTP, password, private key or seed phrase. Pure Earn only needs your public receiving details.",
  },
  vi: {
    method: "Phương thức thanh toán",
    bank: "Chuyển khoản ngân hàng",
    momo: "Ví MoMo",
    usdt: "USDT (BSC)",
    bankName: "Tên ngân hàng",
    holder: "Tên chủ tài khoản",
    account: "Số tài khoản",
    phone: "Số điện thoại MoMo",
    address: "Địa chỉ ví BSC (0x…)",
    bscNote: "Chỉ dùng địa chỉ nạp USDT trên mạng BEP20 (BSC).",
    guideIntro:
      "Chọn phương thức rút và điền thông tin chính xác như trên tài khoản nhận tiền.",
    guideBank: "Chuyển khoản ngân hàng",
    guideBankSteps: [
      "Chọn Chuyển khoản ngân hàng.",
      "Điền đúng tên ngân hàng, tên chủ tài khoản và số tài khoản đã đăng ký.",
      "Kiểm tra lại trước khi gửi; sai thông tin có thể làm chậm thanh toán.",
    ],
    guideMomo: "Ví MoMo",
    guideMomoSteps: [
      "Chọn Ví MoMo.",
      "Điền tên chủ tài khoản đã xác minh và số điện thoại Việt Nam.",
      "Đảm bảo số điện thoại đang nhận được chuyển khoản MoMo.",
    ],
    guideUsdt: "USDT qua BingX (BSC)",
    guideUsdtSteps: [
      "Trong BingX, mở Tài sản → Nạp tiền → USDT.",
      "Chọn mạng BEP20 (BSC), sau đó sao chép địa chỉ bắt đầu bằng 0x.",
      "Dán địa chỉ vào Pure Earn và kiểm tra ký tự đầu, cuối trước khi gửi.",
    ],
    safety:
      "Không cung cấp OTP, mật khẩu, khóa riêng hoặc cụm từ khôi phục. Pure Earn chỉ cần thông tin nhận tiền công khai.",
  },
  zh: {
    method: "付款方式",
    bank: "银行转账",
    momo: "MoMo 钱包",
    usdt: "USDT（BSC）",
    bankName: "银行名称",
    holder: "账户持有人",
    account: "银行账号",
    phone: "MoMo 手机号",
    address: "BSC 钱包地址（0x…）",
    bscNote: "仅使用 BEP20（BSC）网络的 USDT 充值地址。",
    guideIntro: "请选择提现方式，并按照收款账户显示的内容准确填写。",
    guideBank: "银行转账",
    guideBankSteps: [
      "选择银行转账。",
      "准确填写银行名称、账户持有人和银行账号。",
      "提交前再次核对，错误信息可能导致付款延迟。",
    ],
    guideMomo: "MoMo 钱包",
    guideMomoSteps: [
      "选择 MoMo 钱包。",
      "填写已验证的账户姓名和越南手机号。",
      "确认该号码可以接收 MoMo 转账。",
    ],
    guideUsdt: "通过 BingX 提取 USDT（BSC）",
    guideUsdtSteps: [
      "在 BingX 中打开资产 → 充值 → USDT。",
      "选择 BEP20（BSC）网络，并复制以 0x 开头的地址。",
      "粘贴到 Pure Earn，提交前核对地址首尾字符。",
    ],
    safety: "切勿提交 OTP、密码、私钥或助记词。Pure Earn 仅需要公开收款信息。",
  },
  es: {
    method: "Método de pago",
    bank: "Transferencia bancaria",
    momo: "Billetera MoMo",
    usdt: "USDT (BSC)",
    bankName: "Nombre del banco",
    holder: "Titular de la cuenta",
    account: "Número de cuenta",
    phone: "Número de teléfono MoMo",
    address: "Dirección BSC (0x…)",
    bscNote:
      "Usa únicamente una dirección de depósito USDT en la red BEP20 (BSC).",
    guideIntro:
      "Elige un método de retiro e introduce los datos exactamente como aparecen en la cuenta receptora.",
    guideBank: "Transferencia bancaria",
    guideBankSteps: [
      "Selecciona Transferencia bancaria.",
      "Introduce el banco, titular y número de cuenta exactos.",
      "Revisa los datos; un error puede retrasar el pago.",
    ],
    guideMomo: "Billetera MoMo",
    guideMomoSteps: [
      "Selecciona Billetera MoMo.",
      "Introduce el titular verificado y el número vietnamita.",
      "Confirma que el número pueda recibir transferencias MoMo.",
    ],
    guideUsdt: "USDT con BingX (BSC)",
    guideUsdtSteps: [
      "En BingX abre Activos → Depositar → USDT.",
      "Selecciona BEP20 (BSC) y copia la dirección que empieza por 0x.",
      "Pégala en Pure Earn y verifica los primeros y últimos caracteres.",
    ],
    safety:
      "Nunca compartas OTP, contraseña, clave privada ni frase semilla. Pure Earn solo necesita datos públicos de recepción.",
  },
};
const bingxCopy = {
  en: {
    title: "BingX Tier 1 · Verify your wallet",
    benefit:
      "New eligible users can receive a BingX Mystery Box worth at least 5 USDT plus 100 PHT from Pure Earn.",
    rule: "Register through the Pure Earn link, complete KYC, then submit your numeric UID and a screenshot showing the UID and verified KYC status. PHT is released only after admin reconciliation and the 7-day hold.",
    open: "Register on BingX",
    uid: "BingX UID",
    proof: "KYC proof image URL",
    submit: "Submit for verification",
    sent: "Submitted · awaiting reconciliation",
    inactive: "BingX onboarding is being prepared.",
  },
  vi: {
    title: "BingX Tier 1 · Xác minh ví",
    benefit:
      "Người dùng mới đủ điều kiện có thể nhận Mystery Box BingX trị giá ít nhất 5 USDT và thêm 100 PHT từ Pure Earn.",
    rule: "Đăng ký qua liên kết Pure Earn, hoàn thành KYC, sau đó gửi UID dạng số và ảnh hiển thị UID cùng trạng thái KYC đã xác minh. PHT chỉ được giải ngân sau khi admin đối soát và hết thời gian giữ 7 ngày.",
    open: "Đăng ký BingX",
    uid: "UID BingX",
    proof: "Liên kết ảnh xác nhận KYC",
    submit: "Gửi để xác minh",
    sent: "Đã gửi · đang chờ đối soát",
    inactive: "Chương trình BingX đang được chuẩn bị.",
  },
  zh: {
    title: "BingX 第一级 · 验证钱包",
    benefit:
      "符合条件的新用户可获得价值至少 5 USDT 的 BingX 神秘礼盒，并获得 Pure Earn 额外 100 PHT。",
    rule: "通过 Pure Earn 链接注册并完成 KYC，然后提交数字 UID 以及显示 UID 和 KYC 已验证状态的截图。管理员核对并完成 7 天锁定后才释放 PHT。",
    open: "注册 BingX",
    uid: "BingX UID",
    proof: "KYC 证明图片链接",
    submit: "提交验证",
    sent: "已提交 · 等待核对",
    inactive: "BingX 新手任务正在准备中。",
  },
  es: {
    title: "BingX Nivel 1 · Verificar billetera",
    benefit:
      "Los nuevos usuarios elegibles pueden recibir una Caja Misteriosa de BingX de al menos 5 USDT y 100 PHT adicionales de Pure Earn.",
    rule: "Regístrate con el enlace de Pure Earn, completa KYC y envía tu UID numérico y una captura con el UID y KYC verificado. Los PHT se liberan tras la revisión del administrador y 7 días de retención.",
    open: "Registrarse en BingX",
    uid: "UID de BingX",
    proof: "URL de prueba KYC",
    submit: "Enviar para verificación",
    sent: "Enviado · pendiente de revisión",
    inactive: "La incorporación de BingX se está preparando.",
  },
};
const bingxWalletTip = (locale: Locale) =>
  ({
    en: "Need a BSC wallet? BingX is optional — you may use any valid BSC address.",
    vi: "Chưa có ví BSC? BingX chỉ là đề xuất — bạn vẫn có thể dùng bất kỳ địa chỉ BSC hợp lệ nào.",
    zh: "需要 BSC 钱包？BingX 仅为推荐，您也可以使用任何有效的 BSC 地址。",
    es: "¿Necesitas una billetera BSC? BingX es opcional; puedes usar cualquier dirección BSC válida.",
  })[locale];

const copy = {
  en: {
    hello: "Hello",
    home: "Home",
    offers: "Offers",
    wallet: "Wallet",
    profile: "Profile",
    referrals: "Referrals",
    history: "History",
    guide: "Guide",
    leaders: "Leaderboard",
    available: "Available balance",
    pending: "Pending",
    withdraw: "Withdraw",
    completed: "Completed",
    invite: "Invite friends",
    inviteHint: "Earn 5% of approved offer rewards",
    start: "Start earning",
    picked: "Picked for you",
    all: "View all",
    checkin: "Daily check-in",
    claim: "Claim reward",
    claimed: "Claimed today",
    streak: "day streak",
    search: "Search offers",
    partner: "Partner offers",
    cashout: "Cash out",
    amount: "Amount (PHT)",
    request: "Request withdrawal",
    min: "Minimum $5 USD. Swap PHT to USD before withdrawal. Fees depend on your tier.",
    recent: "Recent transactions",
    memberId: "Member ID",
    region: "Region & language",
    save: "Save preferences",
    signout: "Sign out",
    referralEarn: "Referral earnings",
    direct: "Direct members",
    link: "Your invitation link",
    noOffers: "No offers available",
    tier: "Loyalty tier",
  },
  vi: {
    hello: "Xin chào",
    home: "Trang chủ",
    offers: "Nhiệm vụ",
    wallet: "Ví",
    profile: "Hồ sơ",
    referrals: "Giới thiệu",
    history: "Lịch sử",
    guide: "Hướng dẫn",
    leaders: "Bảng xếp hạng",
    available: "Số dư khả dụng",
    pending: "Đang chờ",
    withdraw: "Rút tiền",
    completed: "Hoàn thành",
    invite: "Mời bạn bè",
    inviteHint: "Nhận 5% thưởng offer đã duyệt",
    start: "Bắt đầu kiếm thưởng",
    picked: "Dành cho bạn",
    all: "Xem tất cả",
    checkin: "Điểm danh hằng ngày",
    claim: "Nhận thưởng",
    claimed: "Đã nhận hôm nay",
    streak: "ngày liên tiếp",
    search: "Tìm nhiệm vụ",
    partner: "Nhiệm vụ đối tác",
    cashout: "Rút thưởng",
    amount: "Số PHT",
    request: "Gửi yêu cầu rút",
    min: "Tối thiểu 5 USD. Hãy đổi PHT sang USD trước khi rút. Phí tùy cấp thành viên.",
    recent: "Giao dịch gần đây",
    memberId: "Mã thành viên",
    region: "Quốc gia & ngôn ngữ",
    save: "Lưu cài đặt",
    signout: "Đăng xuất",
    referralEarn: "Thưởng giới thiệu",
    direct: "Thành viên trực tiếp",
    link: "Liên kết giới thiệu",
    noOffers: "Chưa có nhiệm vụ",
    tier: "Cấp thành viên",
  },
  zh: {
    hello: "你好",
    home: "首页",
    offers: "任务",
    wallet: "钱包",
    profile: "个人资料",
    referrals: "邀请",
    history: "历史",
    guide: "提现指南",
    leaders: "排行榜",
    available: "可用余额",
    pending: "待处理",
    withdraw: "提现",
    completed: "已完成",
    invite: "邀请好友",
    inviteHint: "获得已批准任务奖励的5%",
    start: "开始赚取",
    picked: "为你推荐",
    all: "查看全部",
    checkin: "每日签到",
    claim: "领取奖励",
    claimed: "今日已领取",
    streak: "连续天数",
    search: "搜索任务",
    partner: "合作任务",
    cashout: "兑换奖励",
    amount: "PHT 数量",
    request: "提交提现",
    min: "最低提现 5 USD。请先将 PHT 兑换为 USD。",
    recent: "最近交易",
    memberId: "会员编号",
    region: "国家和语言",
    save: "保存设置",
    signout: "退出登录",
    referralEarn: "邀请奖励",
    direct: "直接会员",
    link: "邀请链接",
    noOffers: "暂无任务",
    tier: "会员等级",
  },
  es: {
    hello: "Hola",
    home: "Inicio",
    offers: "Ofertas",
    wallet: "Cartera",
    profile: "Perfil",
    referrals: "Referidos",
    history: "Historial",
    guide: "Guía",
    leaders: "Clasificación",
    available: "Saldo disponible",
    pending: "Pendiente",
    withdraw: "Retirar",
    completed: "Completado",
    invite: "Invita amigos",
    inviteHint: "Gana 5% de recompensas aprobadas",
    start: "Empieza a ganar",
    picked: "Elegido para ti",
    all: "Ver todo",
    checkin: "Registro diario",
    claim: "Reclamar",
    claimed: "Reclamado hoy",
    streak: "días seguidos",
    search: "Buscar ofertas",
    partner: "Ofertas asociadas",
    cashout: "Retirar",
    amount: "Cantidad (PHT)",
    request: "Solicitar retiro",
    min: "Mínimo 5 USD. Convierte PHT a USD antes de retirar.",
    recent: "Transacciones recientes",
    memberId: "ID de miembro",
    region: "País e idioma",
    save: "Guardar preferencias",
    signout: "Cerrar sesión",
    referralEarn: "Ganancias por referidos",
    direct: "Miembros directos",
    link: "Tu enlace de invitación",
    noOffers: "No hay ofertas",
    tier: "Nivel de fidelidad",
  },
};
const extraCopy = {
  en: {
    verified: "Verified partner",
    minijobs: "Minijobs",
    verifiedGroup: "Verified",
    missing: "Missing tracking? Submit proof",
    proofHelp:
      "Submit only a safe screenshot link and masked email/phone. Never upload an OTP, password, seed phrase or full ID document.",
    masked: "Masked email or phone",
    screenshot: "Screenshot URL (https://…)",
    submitProof: "Submit proof",
    openFirst: "Open an offer first.",
    proofSent: "Proof submitted for manual reconciliation.",
    offerOpened:
      "Offer opened. If tracking is delayed, submit supporting proof below.",
    linkUnavailable: "Tracking link unavailable",
    fee: "Fee",
    taskBonus: "Task bonus",
    requestSent: "Withdrawal request submitted",
    bankName: "Bank name",
    accountHolder: "Account holder",
    accountAddress: "Account / LTC address",
    referralRule:
      "VIP revenue share 5–12% · 100 PHT unlocks after the first approved task",
    revenueShare: "Revenue share",
    activationReward: "F1 reaches Silver",
    weekly: "Approved offer earnings in the last 7 days.",
    raceEmpty: "The weekly race has not started yet.",
    saved: "Preferences saved",
    failed: "Something went wrong",
    admin: "Admin dashboard",
    guideItems: [
      "1,000 PHT = 1 USD.",
      "Minimum withdrawal: $5 USD after swapping PHT to USD.",
      "VIP uses lifetime earned PHT: Bronze 5%, Silver 3%, Gold 1%, Diamond 0% withdrawal fee.",
      "Vietnam: bank, MoMo or USDT BSC. Other countries: USDT BSC or LTC.",
      "Partner rewards stay pending for 3–7 days while conversions are validated.",
      "Never share a seed phrase, private key, password or OTP.",
    ],
  },
  vi: {
    verified: "Đối tác đã xác minh",
    minijobs: "Nhiệm vụ nội bộ",
    verifiedGroup: "Đã xác minh",
    missing: "Chưa ghi nhận? Gửi bằng chứng",
    proofHelp:
      "Chỉ gửi liên kết ảnh chụp an toàn và email/số điện thoại đã che bớt. Không gửi OTP, mật khẩu, cụm từ khôi phục hoặc giấy tờ tùy thân đầy đủ.",
    masked: "Email hoặc số điện thoại đã che",
    screenshot: "Liên kết ảnh chụp (https://…)",
    submitProof: "Gửi bằng chứng",
    openFirst: "Hãy mở một nhiệm vụ trước.",
    proofSent: "Đã gửi bằng chứng để đối soát thủ công.",
    offerOpened:
      "Đã mở nhiệm vụ. Nếu ghi nhận chậm, hãy gửi bằng chứng hỗ trợ bên dưới.",
    linkUnavailable: "Chưa thể tạo liên kết theo dõi",
    fee: "Phí",
    taskBonus: "Thưởng nhiệm vụ",
    requestSent: "Đã gửi yêu cầu rút thưởng",
    bankName: "Tên ngân hàng",
    accountHolder: "Tên chủ tài khoản",
    accountAddress: "Tài khoản / địa chỉ LTC",
    referralRule:
      "Chia sẻ 5–12% theo VIP · 100 PHT mở khóa sau nhiệm vụ đầu tiên được duyệt",
    revenueShare: "Tỷ lệ chia sẻ",
    activationReward: "F1 đạt hạng Bạc",
    weekly: "Thu nhập offer đã duyệt trong 7 ngày gần nhất.",
    raceEmpty: "Bảng đua tuần chưa có dữ liệu.",
    saved: "Đã lưu tùy chọn",
    failed: "Đã xảy ra lỗi",
    admin: "Trang quản trị",
    guideItems: [
      "1.000 PHT = 1 USD.",
      "Mức rút tối thiểu: 5 USD sau khi đổi PHT sang USD.",
      "VIP tính theo tổng PHT kiếm được: Đồng 5%, Bạc 3%, Vàng 1%, Kim Cương 0% phí rút.",
      "Việt Nam: ngân hàng, MoMo hoặc USDT BSC. Quốc gia khác: USDT BSC hoặc LTC.",
      "Thưởng đối tác được giữ chờ 3–7 ngày để xác minh chuyển đổi.",
      "Không bao giờ chia sẻ cụm từ khôi phục, khóa riêng, mật khẩu hoặc OTP.",
    ],
  },
  zh: {
    verified: "已验证合作伙伴",
    minijobs: "平台任务",
    verifiedGroup: "已验证",
    missing: "未记录？提交证明",
    proofHelp:
      "仅提交安全的截图链接及部分隐藏的邮箱或手机号。切勿提交 OTP、密码、助记词、私钥或完整身份证件。",
    masked: "部分隐藏的邮箱或手机号",
    screenshot: "截图链接（https://…）",
    submitProof: "提交证明",
    openFirst: "请先打开一个任务。",
    proofSent: "证明已提交，等待人工核对。",
    offerOpened: "任务已打开。如跟踪延迟，请在下方提交证明。",
    linkUnavailable: "暂时无法创建跟踪链接",
    fee: "手续费",
    taskBonus: "任务加成",
    requestSent: "提现申请已提交",
    bankName: "银行名称",
    accountHolder: "账户持有人",
    accountAddress: "账户 / LTC 地址",
    referralRule: "按 VIP 分享 5–12% · 首个任务批准后解锁 100 PHT",
    revenueShare: "收益分成",
    activationReward: "F1 达到白银",
    weekly: "最近 7 天已批准的任务收益。",
    raceEmpty: "本周排行榜暂无数据。",
    saved: "设置已保存",
    failed: "发生错误",
    admin: "管理后台",
    guideItems: [
      "1,000 PHT = 1 USD。",
      "最低提现：兑换后余额 5 USD。",
      "VIP 按累计赚取 PHT 计算：青铜 5%、白银 3%、黄金 1%、钻石 0% 提现费。",
      "越南：银行、MoMo 或 USDT BSC；其他国家：USDT BSC 或 LTC。",
      "合作伙伴奖励将待处理 3–7 天以验证转化。",
      "切勿分享助记词、私钥、密码或 OTP。",
    ],
  },
  es: {
    verified: "Socio verificado",
    minijobs: "Tareas internas",
    verifiedGroup: "Verificado",
    missing: "¿Falta el registro? Envía una prueba",
    proofHelp:
      "Envía solo un enlace seguro de captura y un correo o teléfono parcialmente oculto. Nunca envíes OTP, contraseñas, frases semilla, claves privadas ni documentos completos.",
    masked: "Correo o teléfono parcialmente oculto",
    screenshot: "URL de captura (https://…)",
    submitProof: "Enviar prueba",
    openFirst: "Abre una oferta primero.",
    proofSent: "Prueba enviada para revisión manual.",
    offerOpened:
      "Oferta abierta. Si el seguimiento tarda, envía una prueba abajo.",
    linkUnavailable: "Enlace de seguimiento no disponible",
    fee: "Comisión",
    taskBonus: "Bono de tarea",
    requestSent: "Solicitud de retiro enviada",
    bankName: "Nombre del banco",
    accountHolder: "Titular de la cuenta",
    accountAddress: "Cuenta / dirección LTC",
    referralRule:
      "5–12% según VIP · 100 PHT se liberan tras la primera tarea aprobada",
    revenueShare: "Ingresos compartidos",
    activationReward: "F1 alcanza Plata",
    weekly: "Ganancias aprobadas de los últimos 7 días.",
    raceEmpty: "La clasificación semanal aún no tiene datos.",
    saved: "Preferencias guardadas",
    failed: "Se produjo un error",
    admin: "Panel de administración",
    guideItems: [
      "1.000 PHT = 1 USD.",
      "Retiro mínimo: 5 USD después de convertir PHT.",
      "El VIP usa PHT ganado de por vida: Bronce 5%, Plata 3%, Oro 1% y Diamante 0% de comisión.",
      "Vietnam: banco, MoMo o USDT BSC. Otros países: USDT BSC o LTC.",
      "Las recompensas quedan pendientes entre 3 y 7 días durante la validación.",
      "Nunca compartas frases semilla, claves privadas, contraseñas ni OTP.",
    ],
  },
};
type Words = typeof copy.en & typeof extraCopy.en;
const PhtCoin = ({ size = 18 }: { size?: number }) => (
  <Image
    src="/pht-logo.png"
    alt="PHT"
    width={size}
    height={size}
    className="inline-block shrink-0 rounded-full object-cover align-[-0.18em] shadow-[0_0_10px_rgba(168,85,247,.4)]"
  />
);
const pht = (n = 0) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
    {Math.floor(n).toLocaleString()} PHT <PhtCoin />
  </span>
);
function currentDevice() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("pureearn_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("pureearn_device_id", id);
  }
  return id;
}
const tier = (n = 0) =>
  n >= 200000
    ? { name: "💎", fee: "0%", bonus: "+10%" }
    : n >= 50000
      ? { name: "🥇", fee: "1%", bonus: "+5%" }
      : n >= 5000
        ? { name: "🥈", fee: "3%", bonus: "+2%" }
        : { name: "🥉", fee: "5%", bonus: "0%" };
const tierLabel = (_locale: Locale = "en", n = 0) => {
  const level =
    n >= 200000
      ? "diamond"
      : n >= 50000
        ? "gold"
        : n >= 5000
          ? "silver"
          : "bronze";
  if (level === "diamond") {
    return (
      <Image
        src="/pht-diamond-badge.png"
        alt="Diamond"
        width={24}
        height={24}
        className="inline-block rounded-full"
      />
    );
  }
  return { bronze: "🥉", silver: "🥈", gold: "🥇" }[level];
};
const vipAvatar = (n = 0) =>
  n >= 200000
    ? "from-cyan-300 to-blue-600 ring-cyan-300"
    : n >= 50000
      ? "from-amber-300 to-yellow-600 ring-amber-300"
      : n >= 5000
        ? "from-slate-200 to-slate-500 ring-slate-200"
        : "from-orange-300 to-amber-700 ring-orange-300";
const productLabel = (locale: Locale = "en") =>
  ({
    en: "A PureHub Product",
    vi: "Một sản phẩm của PureHub",
    zh: "PureHub 旗下产品",
    es: "Un producto de PureHub",
  })[locale];
const socialLabel = (locale: Locale = "en") =>
  ({
    en: ["News", "Community"],
    vi: ["Tin tức", "Cộng đồng"],
    zh: ["资讯", "社区"],
    es: ["Noticias", "Comunidad"],
  })[locale];
const statusLabel = (locale: Locale = "en", status = "") =>
  ({
    en: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      completed: "Completed",
      processing: "Processing",
    },
    vi: {
      pending: "Đang chờ",
      approved: "Đã duyệt",
      rejected: "Từ chối",
      completed: "Hoàn thành",
      processing: "Đang xử lý",
    },
    zh: {
      pending: "待处理",
      approved: "已批准",
      rejected: "已拒绝",
      completed: "已完成",
      processing: "处理中",
    },
    es: {
      pending: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
      completed: "Completado",
      processing: "Procesando",
    },
  })[locale][
    status.toLowerCase() as
      "pending" | "approved" | "rejected" | "completed" | "processing"
  ] || status;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null),
    [jobs, setJobs] = useState<Job[]>([]),
    [campaigns, setCampaigns] = useState<Campaign[]>([]),
    [txs, setTxs] = useState<Tx[]>([]),
    [referrals, setReferrals] = useState<Referral[]>([]),
    [leaders, setLeaders] = useState<Leader[]>([]);
  const [members, setMembers] = useState(0),
    [referralPending, setReferralPending] = useState(0),
    [referralRate, setReferralRate] = useState(0.05),
    [activationBonus, setActivationBonus] = useState(500),
    [screen, setScreen] = useState<Screen>("Home"),
    [loading, setLoading] = useState(true),
    [offerLoading, setOfferLoading] = useState(false),
    [menu, setMenu] = useState(false),
    [notice, setNotice] = useState("");
  const locale = user?.locale || "en",
    t = { ...copy[locale], ...extraCopy[locale] } as Words;
  useEffect(() => {
    fetch("/api/device", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: currentDevice() }),
    })
      .then(async (r) => {
        if (!r.ok)
          setNotice((await r.json()).error || "Device verification failed");
      })
      .catch(() => {});
    Promise.allSettled(
      [
        "/api/me",
        "/api/minijobs",
        "/api/transactions",
        "/api/referrals",
        "/api/pht/leaderboard",
      ].map((x) => fetch(x)),
    )
      .then(async (r) => {
        if (r[0].status === "fulfilled" && r[0].value.ok)
          setUser((await r[0].value.json()).user);
        if (r[1].status === "fulfilled" && r[1].value.ok)
          setJobs((await r[1].value.json()).jobs || []);
        if (r[2].status === "fulfilled" && r[2].value.ok)
          setTxs((await r[2].value.json()).transactions || []);
        if (r[3].status === "fulfilled" && r[3].value.ok) {
          const x = await r[3].value.json();
          setMembers(x.members || 0);
          setReferrals(x.recent || []);
          setReferralPending(x.pendingReferralPht || 0);
          setReferralRate(x.terms?.rate || 0.05);
          setActivationBonus(x.terms?.activationBonus || 500);
        }
        if (r[4].status === "fulfilled" && r[4].value.ok)
          setLeaders((await r[4].value.json()).leaders || []);
      })
      .finally(() => setLoading(false));
    loadOffers();
  }, []);
  async function loadOffers() {
    setOfferLoading(true);
    try {
      const r = await fetch("/api/offers/accesstrade", { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCampaigns(
        (Array.isArray(d.data) ? d.data : [])
          .map((x: Record<string, unknown>) => ({
            ...x,
            campaign_id: String(x.campaign_id || x.id || ""),
            name: String(x.name || x.title || "Offer"),
          }))
          .filter((x: Campaign) => x.campaign_id),
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Offerwall unavailable");
    } finally {
      setOfferLoading(false);
    }
  }
  async function openOffer(c: Campaign) {
    const r = await fetch("/api/offers/accesstrade/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignId: c.campaign_id,
          url: c.url,
          deviceId: currentDevice(),
        }),
      }),
      d = await r.json();
    const link =
      d.data?.success_link?.[0]?.short_link ||
      d.data?.success_link?.[0]?.aff_link ||
      d.data?.aff_short_url ||
      d.data?.aff_url;
    if (r.ok && link) {
      localStorage.setItem(
        "pureearn_last_offer",
        JSON.stringify({ clickId: d.clickId, campaignName: c.name }),
      );
      window.open(link, "_blank", "noopener,noreferrer");
      setNotice(t.offerOpened);
    } else setNotice(d.error || t.linkUnavailable);
  }
  const nav = (s: Screen) => {
    setScreen(s);
    setMenu(false);
  };
  const body = loading ? (
    <Skeleton />
  ) : screen === "Home" ? (
    <HomeView
      user={user}
      jobs={jobs}
      campaigns={campaigns}
      members={members}
      t={t}
      nav={nav}
    />
  ) : screen === "Offers" ? (
    <OffersView
      jobs={jobs}
      campaigns={campaigns}
      loading={offerLoading}
      t={t}
      locale={locale}
      refresh={loadOffers}
      open={openOffer}
    />
  ) : screen === "Wallet" ? (
    <WalletView user={user} txs={txs} t={t} nav={nav} onUser={setUser} />
  ) : screen === "Referrals" ? (
    <ReferralView
      user={user}
      members={members}
      referrals={referrals}
      pending={referralPending}
      rate={referralRate}
      activationBonus={activationBonus}
      t={t}
    />
  ) : screen === "History" ? (
    <>
      <Heading icon={History} title={t.history} />
      <TransactionList txs={txs} locale={locale} />
    </>
  ) : screen === "Guide" ? (
    <GuideView t={t} locale={locale} />
  ) : screen === "Leaderboard" ? (
    <LeaderboardView leaders={leaders} t={t} />
  ) : (
    <ProfileView user={user} t={t} nav={nav} />
  );
  return (
    <main className="min-h-screen bg-[#120c22] text-white">
      <section className="relative mx-auto min-h-screen w-full bg-[#1c1431] shadow-[0_0_70px_rgba(50,25,90,.45)] md:max-w-[430px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-[#211737]/95 p-3 backdrop-blur">
          <button onClick={() => setMenu(!menu)} className="round">
            <Menu size={19} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Image
              src="/pht-logo.png"
              alt="Pure Earn"
              width={36}
              height={36}
              className="rounded-xl shadow-[0_0_18px_rgba(168,85,247,.35)]"
              priority
            />
            <div className="min-w-0">
              <small className="font-bold tracking-widest text-violet-300">
                PURE EARN
              </small>
              <h1 className="truncate font-bold">
                {t.hello},{" "}
                {user?.name?.split(" ")[0] || user?.username || "member"}
              </h1>
            </div>
          </div>
          <button className="round">
            <Bell size={18} />
          </button>
        </header>
        <div className="px-4 pb-28 pt-4">
          {notice && (
            <div className="mb-3 rounded-xl bg-amber-300/10 p-3 text-xs text-amber-100">
              {notice}
            </div>
          )}
          {body}
        </div>
        <BottomNav screen={screen} t={t} nav={nav} />
      </section>
      {menu && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setMenu(false)}
        >
          <div
            className="h-full w-1/2 min-w-[180px] max-w-[240px] md:w-[272px] md:max-w-[272px]"
            onClick={(e) => e.stopPropagation()}
          >
            <SideMenu
              user={user}
              screen={screen}
              t={t}
              nav={nav}
              close={() => setMenu(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function navigation(t: Words) {
  return [
    {
      s: "Home" as Screen,
      n: t.home,
      i: Home,
      c: "from-violet-500 to-purple-600",
      soft: "bg-violet-400/15 text-violet-200",
    },
    {
      s: "Offers" as Screen,
      n: t.offers,
      i: LayoutGrid,
      c: "from-cyan-400 to-blue-600",
      soft: "bg-cyan-400/15 text-cyan-200",
    },
    {
      s: "Referrals" as Screen,
      n: t.referrals,
      i: Users,
      c: "from-pink-400 to-fuchsia-600",
      soft: "bg-pink-400/15 text-pink-200",
    },
    {
      s: "Leaderboard" as Screen,
      n: t.leaders,
      i: Trophy,
      c: "from-amber-300 to-orange-500",
      soft: "bg-amber-300/15 text-amber-200",
    },
    {
      s: "Wallet" as Screen,
      n: t.wallet,
      i: WalletCards,
      c: "from-emerald-400 to-teal-600",
      soft: "bg-emerald-400/15 text-emerald-200",
    },
    {
      s: "History" as Screen,
      n: t.history,
      i: History,
      c: "from-blue-400 to-indigo-600",
      soft: "bg-blue-400/15 text-blue-200",
    },
    {
      s: "Guide" as Screen,
      n: t.guide,
      i: BookOpen,
      c: "from-orange-400 to-rose-500",
      soft: "bg-orange-400/15 text-orange-200",
    },
    {
      s: "Profile" as Screen,
      n: t.profile,
      i: UserRound,
      c: "from-violet-400 to-fuchsia-600",
      soft: "bg-fuchsia-400/15 text-fuchsia-200",
    },
  ];
}
function BottomNav({
  screen,
  t,
  nav,
}: {
  screen: Screen;
  t: Words;
  nav: (s: Screen) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 flex w-full -translate-x-1/2 justify-around border-t border-white/10 bg-[#211737]/95 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:max-w-[430px]">
      {navigation(t)
        .filter((x) => ["Home", "Offers", "Wallet", "Profile"].includes(x.s))
        .map((x) => (
          <button
            aria-label={x.n}
            title={x.n}
            key={x.s}
            onClick={() => nav(x.s)}
            className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] transition ${screen === x.s ? `${x.soft} shadow-lg` : `text-slate-500 hover:bg-white/5`}`}
          >
            <x.i size={19} />
            <span className="max-w-16 truncate">{x.n}</span>
          </button>
        ))}
    </nav>
  );
}
function SideMenu({
  user,
  screen,
  t,
  nav,
  close,
}: {
  user: User | null;
  screen: Screen;
  t: Words;
  nav: (s: Screen) => void;
  close: () => void;
}) {
  return (
    <aside className="flex h-full min-h-screen w-full flex-col overflow-y-auto bg-[#251a3d] p-3">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-500 font-bold">
          {user?.name?.[0] || "P"}
        </div>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm">{user?.name}</b>
          <small className="text-slate-400">@{user?.username}</small>
        </div>
        <button onClick={close}>
          <X size={18} />
        </button>
      </div>
      <div className="mt-3 space-y-1">
        {navigation(t).map((x) => (
          <button
            aria-label={x.n}
            title={x.n}
            key={x.s}
            onClick={() => nav(x.s)}
            className={`group flex w-full items-center gap-2 rounded-xl p-1.5 text-left text-xs font-bold transition ${screen === x.s ? `bg-gradient-to-r ${x.c} text-white shadow-lg` : "hover:bg-white/5"}`}
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${screen === x.s ? "bg-white/15" : x.soft}`}
            >
              <x.i size={17} />
            </span>
            <span className="truncate">{x.n}</span>
            <ChevronRight size={13} className="ml-auto opacity-60" />
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href="https://t.me/pureearnglobal"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-sky-400/10 p-2 text-center text-[11px] font-bold text-sky-200"
        >
          {socialLabel(user?.locale)[0]}
        </a>
        <a
          href="https://t.me/pureearngroup"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-sky-400/10 p-2 text-center text-[11px] font-bold text-sky-200"
        >
          {socialLabel(user?.locale)[1]}
        </a>
      </div>
      <div className="mt-3 rounded-xl bg-violet-400/10 p-3">
        <small>{t.available}</small>
        <b className="mt-1 block text-lg">{pht(user?.phtBalance)}</b>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-3 flex w-full items-center gap-2 rounded-xl border border-red-300/20 p-3 text-xs font-bold text-red-200"
      >
        <LogOut size={17} />
        {t.signout}
      </button>
      <p className="mt-auto pt-4 text-center text-[9px] uppercase tracking-widest text-slate-600">
        {productLabel(user?.locale)}
      </p>
    </aside>
  );
}

function HomeView({
  user,
  jobs,
  campaigns,
  members,
  t,
  nav,
}: {
  user: User | null;
  jobs: Job[];
  campaigns: Campaign[];
  members: number;
  t: Words;
  nav: (s: Screen) => void;
}) {
  return (
    <>
      <Balance user={user} t={t} withdraw={() => nav("Wallet")} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat n={pht(user?.pendingPht)} l={t.pending} />
        <Stat n={String(members)} l={t.referrals} />
        <Stat n={tierLabel(user?.locale, user?.totalEarnedPht)} l={t.tier} />
      </div>
      <Checkin user={user} t={t} />
      <button
        onClick={() => nav("Referrals")}
        className="card mt-3 flex w-full items-center gap-3 text-left"
      >
        <span className="icon bg-amber-300 text-[#211737]">
          <Gift />
        </span>
        <span className="flex-1">
          <b className="block text-sm">{t.invite}</b>
          <small className="text-slate-400">{t.inviteHint}</small>
        </span>
        <ChevronRight />
      </button>
      <Title
        e={t.start}
        n={t.picked}
        action={t.all}
        click={() => nav("Offers")}
      />
      <div className="space-y-2">
        {jobs.slice(0, 2).map((x) => (
          <JobCard key={x._id} x={x} />
        ))}
        {campaigns.slice(0, 3).map((x) => (
          <OfferCard
            key={x.campaign_id}
            x={x}
            t={t}
            click={() => nav("Offers")}
          />
        ))}
        {!jobs.length && !campaigns.length && <Empty text={t.noOffers} />}
      </div>
    </>
  );
}
function Balance({
  user,
  t,
  withdraw,
}: {
  user: User | null;
  t: Words;
  withdraw?: () => void;
}) {
  return (
    <section className="rounded-[1.7rem] bg-gradient-to-br from-violet-400 via-violet-600 to-purple-800 p-5 shadow-xl">
      <div className="flex justify-between">
        <div>
          <small>{t.available}</small>
          <h2 className="mt-1 text-3xl font-black">{pht(user?.phtBalance)}</h2>
          <p className="text-xs text-violet-100">
            ≈ ${((user?.phtBalance || 0) / 1000).toFixed(2)} ·{" "}
            {pht(user?.pendingPht)} {t.pending.toLowerCase()}
          </p>
        </div>
        <CircleDollarSign className="text-amber-300" size={34} />
      </div>
      {withdraw && (
        <button
          onClick={withdraw}
          className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold"
        >
          {t.withdraw} ↗
        </button>
      )}
    </section>
  );
}
function Checkin({ user, t }: { user: User | null; t: Words }) {
  const [msg, setMsg] = useState("");
  const today = new Date().toISOString().slice(0, 10),
    done =
      user?.lastCheckinAt &&
      new Date(user.lastCheckinAt).toISOString().slice(0, 10) === today;
  async function claim() {
    const r = await fetch("/api/pht/checkin", { method: "POST" }),
      d = await r.json();
    setMsg(r.ok ? `+${d.reward} PHT` : d.error);
    if (r.ok) setTimeout(() => location.reload(), 700);
  }
  return (
    <div className="card mt-3">
      <div className="flex items-center gap-3">
        <span className="icon bg-violet-500/20 text-violet-300">
          <Gift />
        </span>
        <div className="flex-1">
          <b className="text-sm">{t.checkin}</b>
          <p className="text-xs text-slate-400">
            {user?.checkinStreak || 0} {t.streak}
          </p>
        </div>
        <button
          disabled={!!done}
          onClick={claim}
          className="rounded-xl bg-violet-500 px-3 py-2 text-xs font-bold disabled:opacity-50"
        >
          {done ? t.claimed : t.claim}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-emerald-300">{msg}</p>}
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, () => 5).map((x, i) => (
          <div
            key={i}
            className={`rounded-lg p-1 text-center text-[9px] ${(user?.checkinStreak || 0) > i ? "bg-violet-500" : "bg-white/5"}`}
          >
            D{i + 1}
            <b className="block">{x}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function OffersView({
  jobs,
  campaigns,
  loading,
  t,
  locale,
  refresh,
  open,
}: {
  jobs: Job[];
  campaigns: Campaign[];
  loading: boolean;
  t: Words;
  locale: Locale;
  refresh: () => void;
  open: (c: Campaign) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Campaign | null>(null);
  const list = useMemo(
    () =>
      campaigns.filter((x) => x.name.toLowerCase().includes(q.toLowerCase())),
    [q, campaigns],
  );
  const detail = offerDetailCopy[locale];
  return (
    <>
      <Heading icon={LayoutGrid} title={t.offers} />
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 px-3">
        <Search size={16} />
        <input
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.search}
        />
        <button onClick={refresh}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <BingXTierOne locale={locale} />
      {jobs.length > 0 && (
        <>
          <Title e="Pure Earn" n={t.minijobs} />
          <div className="space-y-2">
            {jobs.map((x) => (
              <JobCard key={x._id} x={x} />
            ))}
          </div>
        </>
      )}
      <Title e={t.verifiedGroup} n={`${t.partner} (${list.length})`} />
      <div className="space-y-2">
        {list.map((x) => (
          <OfferCard
            key={x.campaign_id}
            x={x}
            t={t}
            click={() => setSelected(x)}
          />
        ))}
        {!list.length && <Empty text={t.noOffers} />}
      </div>
      <OfferProofForm t={t} />
      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-5"
          onClick={() => setSelected(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#211737] p-5 md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              {selected.logo && (
                <img
                  src={selected.logo}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                  {selected.campaign_type || "Offer"} · AccessTrade
                </span>
                <h2 className="mt-1 text-xl font-black">{selected.name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="round">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-emerald-400/10 p-3">
                <small className="text-emerald-200">
                  {detail.estimated}
                </small>
                <b className="mt-1 block text-lg text-emerald-300">
                  {selected.estimated_reward_pht
                    ? `${selected.estimated_reward_pht.toLocaleString()} PHT`
                    : detail.validation}
                </b>
              </div>
              <div className="rounded-2xl bg-amber-300/10 p-3">
                <small className="text-amber-100">
                  {detail.pending}
                </small>
                <b className="mt-1 block text-lg text-amber-200">
                  {selected.hold_days || 5} {detail.days}
                </b>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {detail.rewardNote}
            </p>
            <h3 className="mt-5 font-bold">{detail.howTo}</h3>
            <ol className="mt-3 space-y-3">
              {detail
                .steps(selected.name, selected.hold_days || 5)
                .map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl bg-white/5 p-3 text-sm leading-5"
                >
                  <b className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs">
                    {i + 1}
                  </b>
                  <span>{step}</span>
                </li>
                ))}
            </ol>
            <div className="mt-4 rounded-xl border border-red-300/15 bg-red-300/5 p-3 text-xs leading-5 text-red-100">
              {detail.warning}
            </div>
            <button
              onClick={() => {
                open(selected);
                setSelected(null);
              }}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-4 font-black"
            >
              {detail.start} ↗
            </button>
          </section>
        </div>
      )}
    </>
  );
}
function BingXTierOne({ locale }: { locale: Locale }) {
  const [config, setConfig] = useState<{
      active?: boolean;
      affiliateUrl?: string;
      rewardPht?: number;
      holdDays?: number;
      mysteryBox?: string;
    } | null>(null),
    [submission, setSubmission] = useState<{ status?: string } | null>(null),
    [uid, setUid] = useState(""),
    [proof, setProof] = useState(""),
    [turnstileToken, setTurnstileToken] = useState(""),
    [msg, setMsg] = useState(""),
    c = bingxCopy[locale] || bingxCopy.en;
  useEffect(() => {
    fetch("/api/bingx").then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setConfig(d.config);
        setSubmission(d.submission);
      }
    });
  }, []);
  async function submit() {
    const r = await fetch("/api/bingx", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bingxUid: uid,
          proofImageUrl: proof,
          turnstileToken,
        }),
      }),
      d = await r.json();
    setMsg(r.ok ? c.sent : d.error || "Error");
    if (r.ok) setSubmission(d.submission);
  }
  if (!config?.active) return null;
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#241744] to-[#102c47] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-cyan-300/15 px-2 py-1 text-[10px] font-bold text-cyan-200">
            KYC REQUIRED
          </span>
          <h3 className="mt-2 font-black">{c.title}</h3>
        </div>
        <b className="text-amber-300">+{config.rewardPht} PHT</b>
      </div>
      <p className="mt-2 text-xs leading-5 text-cyan-50">{c.benefit}</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-300">{c.rule}</p>
      <a
        href={config.affiliateUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block rounded-xl bg-cyan-400 p-3 text-center text-xs font-black text-[#101a2d]"
      >
        {c.open} ↗
      </a>
      {submission ? (
        <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-amber-200">
          {c.sent}
        </p>
      ) : (
        <>
          <input
            className="field mt-3"
            inputMode="numeric"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder={c.uid}
          />
          <input
            className="field mt-2"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder={c.proof}
          />
          <div className="mt-2">
            <Turnstile onToken={setTurnstileToken} />
          </div>
          <button
            onClick={submit}
            className="mt-2 w-full rounded-xl bg-violet-500 p-3 text-xs font-bold"
          >
            {c.submit}
          </button>
        </>
      )}
      {msg && <p className="mt-2 text-xs text-violet-200">{msg}</p>}
    </section>
  );
}
function OfferProofForm({ t }: { t: Words }) {
  const [proof, setProof] = useState(""),
    [contact, setContact] = useState(""),
    [turnstileToken, setTurnstileToken] = useState(""),
    [msg, setMsg] = useState("");
  async function send() {
    const last = JSON.parse(
      localStorage.getItem("pureearn_last_offer") || "null",
    );
    if (!last) return setMsg(t.openFirst);
    const r = await fetch("/api/offer-proofs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...last,
          proofUrl: proof,
          registeredContact: contact,
          turnstileToken,
        }),
      }),
      d = await r.json();
    setMsg(r.ok ? t.proofSent : d.error);
    if (r.ok) setProof("");
  }
  return (
    <details className="card mt-5">
      <summary className="cursor-pointer text-sm font-bold">
        {t.missing}
      </summary>
      <p className="mt-2 text-[11px] leading-5 text-slate-400">{t.proofHelp}</p>
      <input
        className="field mt-2"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder={t.masked}
      />
      <input
        className="field mt-2"
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        placeholder={t.screenshot}
      />
      <div className="mt-2">
        <Turnstile onToken={setTurnstileToken} />
      </div>
      <button
        onClick={send}
        className="mt-2 w-full rounded-xl bg-violet-500 p-3 text-xs font-bold"
      >
        {t.submitProof}
      </button>
      {msg && <p className="mt-2 text-xs text-violet-200">{msg}</p>}
    </details>
  );
}
function JobCard({ x }: { x: Job }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="icon bg-violet-500">{x.icon || "P"}</span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm">{x.title}</b>
        <small className="text-slate-400">{x.tags?.[0] || "Minijob"}</small>
      </div>
      <b className="text-xs text-amber-300">
        +{x.reward} {x.rewardCurrency || "PHT"}
      </b>
    </div>
  );
}
function OfferCard({
  x,
  t,
  click,
}: {
  x: Campaign;
  t: Words;
  click: () => void;
}) {
  return (
    <button
      onClick={click}
      className="card flex w-full items-center gap-3 text-left"
    >
      {x.logo ? (
        <img
          src={x.logo}
          alt=""
          className="h-11 w-11 rounded-xl object-cover"
        />
      ) : (
        <span className="icon">
          <Globe2 />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm">{x.name}</b>
        <small className="text-slate-400">{t.verified}</small>
      </div>
      <ExternalLink size={15} />
    </button>
  );
}

function WalletView({
  user,
  txs,
  t,
  nav,
  onUser,
}: {
  user: User | null;
  txs: Tx[];
  t: Words;
  nav: (s: Screen) => void;
  onUser: (user: User | null) => void;
}) {
  const locale = user?.locale || "en",
    pc = payoutCopy[locale];
  const methods =
    user?.country === "VN"
      ? ["BANK_VN", "MOMO", "USDT_BSC"]
      : ["USDT_BSC", "LTC"];
  const [method, setMethod] = useState(methods[0]),
    [amount, setAmount] = useState(""),
    [account, setAccount] = useState(""),
    [bankName, setBankName] = useState(""),
    [accountName, setAccountName] = useState(""),
    [swapAmount, setSwapAmount] = useState(""),
    [msg, setMsg] = useState("");
  const labels: Record<string, string> = {
    BANK_VN: pc.bank,
    MOMO: pc.momo,
    USDT_BSC: pc.usdt,
    LTC: "Litecoin (LTC)",
  };
  function changeMethod(value: string) {
    setMethod(value);
    setAccount("");
    setBankName("");
    setAccountName("");
    setMsg("");
  }
  async function send() {
    const r = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        usdAmount: amount,
        method,
        account,
        bankName,
        accountName,
      }),
    });
    const d = await r.json();
    setMsg(r.ok ? t.requestSent : d.error || t.failed);
    if (r.ok) onUser(user ? { ...user, usdBalance: d.usdBalance } : user);
  }
  async function swap() {
    const r = await fetch("/api/pht/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phtAmount: swapAmount }),
      }),
      d = await r.json();
    setMsg(
      r.ok
        ? `${Number(swapAmount).toLocaleString()} PHT → $${d.usd.toFixed(2)} USD`
        : d.error || t.failed,
    );
    if (r.ok) {
      onUser(
        user
          ? { ...user, phtBalance: d.phtBalance, usdBalance: d.usdBalance }
          : user,
      );
      setSwapAmount("");
    }
  }
  const lv = tier(user?.totalEarnedPht);
  return (
    <>
      <Heading icon={WalletCards} title={t.wallet} />
      <div className="mt-4">
        <Balance user={user} t={t} />
      </div>
      <div className="card mt-3 grid grid-cols-3 text-center">
        <Stat n={tierLabel(user?.locale, user?.totalEarnedPht)} l={t.tier} />
        <Stat n={lv.fee} l={t.fee} />
        <Stat n={lv.bonus} l={t.taskBonus} />
      </div>
      <section className="card mt-3 overflow-hidden bg-gradient-to-br from-violet-500/15 to-emerald-400/10">
        <div className="flex items-center justify-between">
          <div>
            <small className="text-slate-400">USD available</small>
            <b className="block text-2xl text-emerald-300">
              ${Number(user?.usdBalance || 0).toFixed(2)}
            </b>
          </div>
          <ArrowDownToLine className="text-emerald-300" />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          1,000 PHT = $1.00 USD ·{" "}
          {user?.locale === "vi"
            ? "Đổi PHT sang USD trước khi rút tiền."
            : "Swap PHT to USD before requesting a payout."}
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="100"
            step="1"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            className="field min-w-0 flex-1"
            placeholder="PHT"
          />
          <button
            onClick={() =>
              setSwapAmount(String(Math.floor(user?.phtBalance || 0)))
            }
            className="rounded-xl bg-white/5 px-3 text-xs"
          >
            MAX
          </button>
          <button
            onClick={swap}
            className="rounded-xl bg-emerald-400 px-4 text-sm font-black text-[#10251e]"
          >
            SWAP
          </button>
        </div>
      </section>
      <section className="card mt-3">
        <b>{t.cashout}</b>
        <p className="mt-1 text-xs text-slate-400">{t.min}</p>
        <label className="mt-3 block text-xs">
          {pc.method}
          <select
            className="field mt-1"
            value={method}
            onChange={(e) => changeMethod(e.target.value)}
          >
            {methods.map((x) => (
              <option key={x} value={x}>
                {labels[x]}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-xs">
          {t.amount}
          <div className="mt-1 flex rounded-xl border border-white/10">
            <input
              type="number"
              min="5"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0 flex-1 bg-transparent p-3 outline-none"
              placeholder="5.00 USD"
            />
            <button
              onClick={() =>
                setAmount(String(Number(user?.usdBalance || 0).toFixed(2)))
              }
              className="px-3 text-violet-300"
            >
              MAX
            </button>
          </div>
        </label>
        {method === "BANK_VN" && (
          <>
            <input
              className="field mt-2"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={pc.bankName}
            />
            <input
              className="field mt-2"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={pc.holder}
            />
            <input
              className="field mt-2"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={pc.account}
            />
          </>
        )}
        {method === "MOMO" && (
          <>
            <input
              className="field mt-2"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder={pc.holder}
            />
            <input
              className="field mt-2"
              inputMode="tel"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={pc.phone}
            />
          </>
        )}
        {method === "USDT_BSC" && (
          <>
            <input
              className="field mt-2"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder={pc.address}
            />
            <p className="mt-2 rounded-xl bg-amber-300/10 p-2 text-[11px] leading-4 text-amber-200">
              {pc.bscNote}
            </p>
            <button
              onClick={() => nav("Offers")}
              className="mt-2 flex w-full items-center gap-2 rounded-xl bg-cyan-400/10 p-3 text-left text-[11px] leading-4 text-cyan-100"
            >
              <CircleDollarSign size={18} className="shrink-0 text-cyan-300" />
              <span className="flex-1">{bingxWalletTip(locale)}</span>
              <ChevronRight size={15} />
            </button>
          </>
        )}
        {method === "LTC" && (
          <input
            className="field mt-2"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder={t.accountAddress}
          />
        )}
        <button
          onClick={send}
          className="mt-3 w-full rounded-xl bg-violet-500 p-3 text-sm font-bold"
        >
          {t.request}
        </button>
        {msg && <p className="mt-2 text-xs text-violet-200">{msg}</p>}
        <button
          onClick={() => nav("Guide")}
          className="mt-3 w-full text-xs underline"
        >
          {t.guide}
        </button>
      </section>
      <Title e="PHT" n={t.recent} />
      <TransactionList txs={txs.slice(0, 8)} locale={user?.locale} />
    </>
  );
}
function TransactionList({
  txs,
  locale = "en",
}: {
  txs: Tx[];
  locale?: Locale;
}) {
  return (
    <div className="mt-3 space-y-2">
      {txs.map((x) => (
        <div key={x._id} className="card flex items-center gap-3">
          <span
            className={`icon ${x.amount < 0 ? "text-red-300" : "text-emerald-300"}`}
          >
            {x.amount < 0 ? <ArrowDownToLine /> : <ArrowUpRight />}
          </span>
          <div className="min-w-0 flex-1">
            <b className="block truncate text-sm">{x.source || x.type}</b>
            <small className="text-slate-500">
              {new Date(x.createdAt).toLocaleDateString(locale)}
            </small>
          </div>
          <div className="text-right">
            <b className={x.amount < 0 ? "text-red-300" : "text-emerald-300"}>
              {x.amount < 0 ? "-" : "+"}
              {pht(Math.abs(x.amount))}
            </b>
            <small className="block text-slate-400">
              {statusLabel(locale, x.status)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReferralView({
  user,
  members,
  referrals,
  pending,
  rate,
  activationBonus,
  t,
}: {
  user: User | null;
  members: number;
  referrals: Referral[];
  pending: number;
  rate: number;
  activationBonus: number;
  t: Words;
}) {
  const link = user?.referralCode
    ? `https://earn.blissbiovn.com/ref/${user.referralCode}`
    : "";
  return (
    <>
      <Heading icon={Users} title={t.referrals} />
      <section className="mt-4 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-800 p-5">
        <small>{t.referralEarn}</small>
        <h2 className="text-3xl font-black">{pht(user?.referralEarnings)}</h2>
        <p className="mt-2 text-xs">{t.referralRule}</p>
      </section>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat n={`${Math.round(rate * 100)}%`} l={t.revenueShare} />
        <Stat n={pht(pending)} l={t.pending} />
        <Stat n={pht(activationBonus)} l={t.activationReward} />
      </div>
      <div className="card mt-3">
        <b>{t.link}</b>
        <div className="mt-2 flex gap-2 rounded-xl bg-black/15 p-2">
          <span className="min-w-0 flex-1 truncate text-xs">{link}</span>
          <button onClick={() => navigator.clipboard.writeText(link)}>
            <Copy size={16} />
          </button>
        </div>
      </div>
      <Title e={String(members)} n={t.direct} />
      <div className="space-y-2">
        {referrals.map((x) => (
          <div key={x._id} className="card flex items-center gap-3">
            <span className="icon bg-violet-500">{x.name?.[0] || "M"}</span>
            <div>
              <b className="text-sm">{x.name || x.username}</b>
              <small className="block text-slate-400">@{x.username}</small>
            </div>
            <BadgeCheck className="ml-auto text-emerald-300" />
          </div>
        ))}
      </div>
    </>
  );
}
function LeaderboardView({ leaders, t }: { leaders: Leader[]; t: Words }) {
  return (
    <>
      <Heading icon={Trophy} title={t.leaders} />
      <p className="mt-2 text-xs text-slate-400">{t.weekly}</p>
      <div className="mt-4 space-y-2">
        {leaders.map((x, i) => (
          <div key={x.userId} className="card flex items-center gap-3">
            <b className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 text-[#211737]">
              {i + 1}
            </b>
            <span className="flex-1 truncate text-sm">
              {x.name || x.username || "Member"}
            </span>
            <b className="text-amber-300">{pht(x.pht)}</b>
          </div>
        ))}
        {!leaders.length && <Empty text={t.raceEmpty} />}
      </div>
    </>
  );
}
function GuideView({ t, locale }: { t: Words; locale: Locale }) {
  const pc = payoutCopy[locale];
  const guides = [
    {
      title: pc.guideBank,
      image: "/guides/withdraw-bank.png",
      steps: pc.guideBankSteps,
    },
    {
      title: pc.guideMomo,
      image: "/guides/withdraw-momo.png",
      steps: pc.guideMomoSteps,
    },
    {
      title: pc.guideUsdt,
      image: "/guides/withdraw-usdt-bsc.png",
      steps: pc.guideUsdtSteps,
    },
  ];
  return (
    <>
      <Heading icon={BookOpen} title={t.guide} />
      <p className="mt-3 text-xs leading-5 text-slate-300">{pc.guideIntro}</p>
      <div className="mt-4 space-y-3">
        {guides.map((g) => (
          <article className="card overflow-hidden p-0" key={g.title}>
            <Image
              src={g.image}
              alt={g.title}
              width={1254}
              height={1254}
              className="h-36 w-full object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold">{g.title}</h3>
              <ol className="mt-2 space-y-2">
                {g.steps.map((step, i) => (
                  <li
                    className="flex gap-2 text-xs leading-5 text-slate-300"
                    key={step}
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-500 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
        {pc.safety}
      </div>
    </>
  );
}
function ProfileView({
  user,
  t,
  nav,
}: {
  user: User | null;
  t: Words;
  nav: (s: Screen) => void;
}) {
  const [country, setCountry] = useState(user?.country || "OTHER"),
    [countryName, setCountryName] = useState(user?.countryName || ""),
    [locale, setLocale] = useState<Locale>(user?.locale || "en"),
    [msg, setMsg] = useState("");
  async function save() {
    const r = await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ country, countryName, locale }),
    });
    setMsg(r.ok ? t.saved : t.failed);
    if (r.ok) setTimeout(() => location.reload(), 400);
  }
  const quick = navigation(t).filter((x) =>
    ["Referrals", "Leaderboard", "History", "Guide"].includes(x.s),
  );
  return (
    <>
      <Heading icon={UserRound} title={t.profile} />
      <section className="mt-4 overflow-hidden rounded-3xl border border-violet-300/15 bg-gradient-to-br from-[#493083] to-[#22183c] p-4">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-black shadow-lg ring-2 ring-offset-2 ring-offset-[#33225b] ${vipAvatar(user?.totalEarnedPht)}`}
          >
            {user?.name?.[0] || "P"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-bold">{user?.name}</h2>
            <p className="truncate text-xs text-violet-200">
              @{user?.username}
            </p>
          </div>
          <span className="rounded-full bg-amber-300/15 px-3 py-1 text-[10px] font-bold text-amber-200">
            {tierLabel(user?.locale, user?.totalEarnedPht)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-black/15 p-2">
            <small className="text-violet-200">{t.memberId}</small>
            <b className="block truncate text-xs">{user?.userId || "—"}</b>
          </div>
          <div className="rounded-xl bg-black/15 p-2">
            <small className="text-violet-200">Total Earned</small>
            <b className="block truncate text-xs">
              {pht(user?.totalEarnedPht)}
            </b>
          </div>
        </div>
      </section>
      <section className="card mt-3">
        <div className="flex items-center gap-2">
          <span className="icon h-9 w-9 bg-cyan-400/15 text-cyan-200">
            <Languages />
          </span>
          <b>{t.region}</b>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label>
            <select
              aria-label="Country"
              className="field"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {countryOptions(locale).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
              <option value="OTHER">🌍 Other</option>
            </select>
            {normalizeCountry(country) === "OTHER" && (
              <input
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
                placeholder={
                  locale === "vi"
                    ? "Nhập quốc gia/vùng lãnh thổ"
                    : "Enter country/territory"
                }
                className="field mt-2"
                maxLength={80}
              />
            )}
          </label>
          <label>
            <select
              aria-label="Language"
              className="field"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              <option value="en">EN</option>
              <option value="vi">VI</option>
              <option value="zh">中文</option>
              <option value="es">ES</option>
            </select>
          </label>
        </div>
        <button
          onClick={save}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-3 text-xs font-bold shadow-lg"
        >
          <Save size={16} />
          {t.save}
        </button>
        {msg && <p className="mt-2 text-xs">{msg}</p>}
      </section>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {quick.map((x) => (
          <button
            aria-label={x.n}
            title={x.n}
            key={x.s}
            onClick={() => nav(x.s)}
            className="card group flex min-h-24 flex-col items-start justify-between text-left"
          >
            <span className={`icon ${x.soft}`}>
              <x.i />
            </span>
            <span className="flex w-full items-center gap-1 text-xs font-bold">
              <span className="min-w-0 flex-1 truncate">{x.n}</span>
              <ChevronRight size={14} />
            </span>
          </button>
        ))}
      </div>
      {user?.role === "admin" && (
        <a
          href="/admin"
          className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-300/20 to-orange-400/10 p-3 text-sm font-bold text-amber-200"
        >
          <ShieldCheck />
          {t.admin}
          <ChevronRight className="ml-auto" size={16} />
        </a>
      )}
      <button
        aria-label={t.signout}
        title={t.signout}
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-400/5 p-3 text-sm text-red-200"
      >
        <LogOut size={17} />
        {t.signout}
      </button>
    </>
  );
}

function Heading({ icon: Icon, title }: { icon: typeof Home; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="icon bg-violet-500/15 text-violet-300">
        <Icon />
      </span>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}
function Title({
  e,
  n,
  action,
  click,
}: {
  e: string;
  n: string;
  action?: string;
  click?: () => void;
}) {
  return (
    <div className="mb-3 mt-6 flex items-end justify-between">
      <div>
        <small className="font-bold uppercase tracking-widest text-violet-300">
          {e}
        </small>
        <h2 className="text-lg font-black">{n}</h2>
      </div>
      {action && (
        <button onClick={click} className="text-xs text-violet-300">
          {action}
        </button>
      )}
    </div>
  );
}
function Stat({ n, l }: { n: React.ReactNode; l: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-2">
      <b className="block truncate text-sm">{n}</b>
      <small className="text-[9px] text-slate-400">{l}</small>
    </div>
  );
}
function Detail({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-2 py-1 text-xs">
      <span className="text-slate-400">{l}</span>
      <b className="truncate">{v}</b>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 p-7 text-center text-xs text-slate-400">
      <LayoutGrid className="mx-auto mb-2 text-violet-300" />
      {text}
    </div>
  );
}
function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-40 animate-pulse rounded-3xl bg-violet-400/15" />
      <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
