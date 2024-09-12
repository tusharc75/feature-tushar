const IconWithPulse = ({ children, disabled = false }) => {
  return (
    <div className="relative isolate">
      {!disabled && (
        <span className="animate-ripple dark-bg-[var(--dark-primary)] rounded-[30px] bg-white">
          <span></span>
          <span></span>
        </span>
      )}
      {children}
    </div>
  );
};

export default IconWithPulse;
