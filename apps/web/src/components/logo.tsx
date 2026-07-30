export function Logo(props: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M400 250C400 167.157 332.843 100 250 100C167.157 100 100 167.157 100 250C100 332.843 167.157 400 250 400V500C111.929 500 0 388.071 0 250C0 111.929 111.929 0 250 0C388.071 0 500 111.929 500 250C500 388.071 388.071 500 250 500V400C332.843 400 400 332.843 400 250Z"
        fill="currentColor"
      />
      <path d="M250 0H500V250H250V0Z" fill="currentColor" />
    </svg>
  );
}
