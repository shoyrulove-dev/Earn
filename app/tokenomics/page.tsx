export const metadata = {
  title: "PE Tokenomics & Roadmap | Pure Earn",
  description: "Pre-launch PE ecosystem points, tokenomics principles and the Pure Earn roadmap.",
};

const phases = [
  ["Now", "Grow Pure Hub and Pure Earn", "Launch Pure Hub on Google Play, expand verified tasks and build a real member community."],
  ["50K members", "Community readiness", "Publish the final supply, allocation, eligibility rules and an independently reviewable snapshot."],
  ["Testnet", "Token validation", "Test wallet linking, claims, vesting and anti-fraud controls before any mainnet token exists."],
  ["Mainnet", "Community launch", "Issue PE only after technical, legal, liquidity and security reviews are complete."],
];

export default function TokenomicsPage() {
  return <main className="min-h-screen bg-[#100b1f] px-4 py-10 text-white">
    <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#211737] p-6 shadow-2xl md:p-10">
      <p className="text-xs font-black uppercase tracking-[.2em] text-violet-300">Pure Earn · PE</p>
      <h1 className="mt-3 text-3xl font-black">Tokenomics trước phát hành</h1>
      <p className="mt-4 leading-7 text-slate-300">PE hiện là điểm đóng góp nội bộ, không phải token blockchain, không có giá quy đổi, không thể rút hoặc chuyển nhượng. Thành viên nhận 1 PE cho mỗi 1.000 PHT nhiệm vụ được duyệt. Pure Earn không cam kết airdrop, giá, thanh khoản hay niêm yết sàn.</p>
      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-5"><b>Phát hành thấp</b><p className="mt-2 text-sm leading-6 text-slate-400">Nhiệm vụ đã duyệt nhận 1 PE/1.000 PHT; điểm danh nhận 0,01 PE/ngày; giới thiệu nhận 0,1 PE khi người mới hoàn thành 2 nhiệm vụ được duyệt. Số dư USD không tạo PE.</p></div>
        <div className="rounded-2xl bg-white/5 p-5"><b>Chống gian lận</b><p className="mt-2 text-sm leading-6 text-slate-400">Nhiệm vụ bị từ chối, hoàn trả hoặc vi phạm điều kiện không đủ tiêu chuẩn cho snapshot.</p></div>
        <div className="rounded-2xl bg-white/5 p-5"><b>Tổng cung chưa chốt</b><p className="mt-2 text-sm leading-6 text-slate-400">Tổng cung và tỷ lệ đổi từ điểm PE chỉ được công bố sau khi dữ liệu cộng đồng đủ lớn.</p></div>
        <div className="rounded-2xl bg-white/5 p-5"><b>Phân bổ minh bạch</b><p className="mt-2 text-sm leading-6 text-slate-400">Nếu có token, snapshot, quỹ cộng đồng, vesting và quyền quản trị sẽ được công bố trước khi claim.</p></div>
      </section>
      <h2 className="mt-10 text-2xl font-black">Roadmap</h2>
      <div className="mt-4 space-y-3">{phases.map(([when,title,text]) => <section key={when} className="flex gap-4 rounded-2xl border border-white/10 p-4"><span className="h-fit shrink-0 rounded-lg bg-violet-500/15 px-2 py-1 text-xs font-black text-violet-300">{when}</span><div><b>{title}</b><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div></section>)}</div>
      <div className="mt-8 flex flex-wrap gap-4 text-sm font-bold text-violet-300"><a href="/dashboard">← Pure Earn</a><a href="/terms">Điều khoản</a><a href="/faq">FAQ</a></div>
    </article>
  </main>;
}
