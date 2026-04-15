const Loader = ({ label = "Loading" }) => (
  <div className="flex items-center justify-center gap-3 rounded-lg border border-ink/10 bg-white p-6 text-sm text-ink/70 shadow-soft dark:border-white/10 dark:bg-ink dark:text-white/75">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-mint border-t-transparent" />
    {label}
  </div>
);

export default Loader;
