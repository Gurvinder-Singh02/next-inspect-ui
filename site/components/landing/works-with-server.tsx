export const WorksWithServerCard = ({ title }: { title: string }) => (
  <div className="rounded-lg border border-border p-4">
    <h3 className="font-inter text-[15px] font-medium">{title}</h3>
    <p className="mt-1 font-inter text-[14px] text-muted-foreground">
      Rendered on the server. Hover should resolve into this file.
    </p>
  </div>
)
