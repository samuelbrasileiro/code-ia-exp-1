type PageHeaderProps = {
  title: string;
  description?: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      {description ? <p className="sub">{description}</p> : null}
    </div>
  );
}
