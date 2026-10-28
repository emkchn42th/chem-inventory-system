"use client";

// 재고 삭제 버튼 (추가 기능 단계)
// 실수로 지우지 않도록 한 번 더 확인을 받는다. (브라우저 confirm 창 대신 화면 안에서)

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./DeleteStock.module.css";
import { useToast } from "./Toast";
import { useStore } from "../lib/store";
import { deleteStock } from "../app/stock/[id]/edit/actions";

export default function DeleteStock({ id, name, inUse }) {
  const router = useRouter();
  const toast = useToast();
  const { removeFromBasket } = useStore();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (inUse) {
    return (
      <div className={styles.box}>
        <p className={styles.title}>재고 삭제</p>
        <p className={styles.text}>사용중인 재고는 지울 수 없어요. 먼저 반납해 주세요.</p>
      </div>
    );
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      const result = await deleteStock(id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      removeFromBasket(id); // 바구니에 담겨 있었다면 같이 뺀다
      toast.show(`${name} 재고 #${id} 를 지웠어요.`, { tone: "danger" });
      router.push(`/reagents/${encodeURIComponent(name)}`);
      router.refresh();
    });
  }

  return (
    <div className={styles.box}>
      <p className={styles.title}>재고 삭제</p>
      <p className={styles.text}>다 쓰거나 폐기한 시약병이라면 장부에서 지울 수 있어요. 대여 기록도 함께 지워져요.</p>
      {error && <p className={styles.error}>{error}</p>}
      {!asking ? (
        <button type="button" className={styles.danger} onClick={() => setAsking(true)}>
          이 재고 지우기
        </button>
      ) : (
        <div className={styles.confirm}>
          <span className={styles.ask}>정말 {name} #{id} 를 지울까요? 되돌릴 수 없어요.</span>
          <div className={styles.row}>
            <button type="button" className={styles.cancel} onClick={() => setAsking(false)} disabled={pending}>
              취소
            </button>
            <button type="button" className={styles.dangerFill} onClick={handleDelete} disabled={pending}>
              {pending ? "지우는 중..." : "삭제"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
