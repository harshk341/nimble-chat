const Loader: React.FC<{ classname: string }> = ({ classname }) => {
  return (
    <span
      className={`animate-spin border-r-transparent rounded-full inline-block ${classname}`}
    ></span>
  );
};

export default Loader;
