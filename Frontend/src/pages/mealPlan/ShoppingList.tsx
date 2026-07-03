import { useEffect, useState } from "react";
import { Checkbox, Loader, Message } from "rsuite";
import { useGenerateShoppingListQuery } from "../../api/shoppingListApi";
import { loadChecks, saveChecks, toggleCheck } from "../../utils/shoppingListChecks";

type Props = { userId: string; start: string; end: string };

const arr = (v: any): any[] => (Array.isArray(v) ? v : v?.$values ?? []);

export default function ShoppingList({ userId, start, end }: Props) {
  const { data, isLoading, isError } = useGenerateShoppingListQuery(
    { userId, start, end },
    { skip: !userId }
  );
  const items: any[] = data?.result?.$values ?? [];
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    setChecked(loadChecks(userId, start, end));
  }, [userId, start, end]);

  const onToggle = (name: string) => {
    const next = toggleCheck(checked, name);
    setChecked(next);
    saveChecks(userId, start, end, next);
  };

  if (isLoading) return <Loader content="Building your list…" />;
  if (isError) return <Message type="error">Couldn't build the shopping list.</Message>;
  if (items.length === 0) return <Message type="info">Nothing scheduled in this range.</Message>;

  return (
    <div>
      {items.map((item) => {
        const key = item.name.trim().toLowerCase();
        const units = arr(item.units);
        const fromRecipes = arr(item.fromRecipes);
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Checkbox
              checked={checked.includes(key)}
              onChange={() => onToggle(key)}
            />
            <span style={{ textDecoration: checked.includes(key) ? "line-through" : "none" }}>
              {item.name}
              {units.length ? ` — ${units.join(", ")}` : ""}
            </span>
            {fromRecipes.length ? (
              <span style={{ color: "var(--bm-faint)", fontSize: 12 }}>
                from: {fromRecipes.join(", ")}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
