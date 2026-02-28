interface GreetingBadgeProps {
  name: string;
}

export default function GreetingBadge({ name }: GreetingBadgeProps) {
  return <span>Hello, {name}!</span>;
}
