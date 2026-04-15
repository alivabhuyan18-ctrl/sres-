const StatCard = ({ title, value, note, icon: Icon, tone = "mint" }) => {
  const tones = {
    mint: "bg-mint/10 text-mint",
    coral: "bg-coral/10 text-coral",
    saffron: "bg-saffron/20 text-ink",
    ink: "bg-ink/10 text-ink dark:bg-white/10 dark:text-white"
  };

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-ink">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60 dark:text-white/60">{title}</p>
          <p className="mt-2 text-3xl font-bold text-ink dark:text-white">{value}</p>
          {note && <p className="mt-2 text-xs text-ink/55 dark:text-white/55">{note}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-3 ${tones[tone]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
