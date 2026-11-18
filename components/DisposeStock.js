"use client";

// 폐기 처리 상자 (추가 기능, 관리자 전용)
// 만료·파손된 시약병을 지우지 않고 "폐기" 기록으로 남긴다.
// 아래에 MSDS 의 폐기 관련 문구를 참고용으로 보여 준다.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./DeleteStock.module.css";
import { useToast } from "./Toast";
import { useStore } from "../lib/store";
import { disposeStock } from "../app/stock/[id]/edit/actions";

const METHODS = ["지정폐기물 위탁 처리", "중화 후 배출", "희석 후 배출", "기타"];

export default function DisposeStock({ id, name, inUse, expired, guide = [] }) {
  const router = useRouter();
  const toast = useToast();
  const { removeFromBasket } = useStore();
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState(expired ? "유효기한 지남" : "");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (inUse) {
    return (
      <div className={styles.disposeBox}>
        <p className={styles.disposeTitle}>🗑 폐기 처리</p>
        <p className={styles.text}>사용중인 재고는 폐기할 수 없어요. 먼저 반납해 주세요.</p>
      </div>
    );
  }

  function handleDispose() {
    setError("");
    startTransition(async () => {
      const result = await disposeStock(id, method, note);
      if (!result.ok) {
        setError(result.message);
        setAsking(false);
        return;
      }
      removeFromBasket(id);
      toast.show(`${name} #${id} 를 폐기 처리했어요.`, { tone: "success" });
      router.push("/disposal");
      router.refresh();
    });
  }

  return (
    <div className={styles.disposeBox}>
      <p className={styles.disposeTitle}>🗑 폐기 처리</p>
      <p className={styles.text}>
        유효기한이 지났거나 오염·파손된 시약병은 지우지 말고 폐기로 기록하세요. 폐기 기록은 장부에 남아요.
      </p>

      {guide.length > 0 && (
        <div className={styles.guide}>
          <p className={styles.guideTitle}>MSDS 폐기 안내</p>
          <ul>
            {guide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.formRow}>
        <label className={styles.field}>
          <span>처리 방법</span>
          <select value={method} onChange={(event) => setMethod(event.target.value)} className={styles.input}>
            {METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>메모 (선택)</span>
          <input
            value={note}
            maxLength={200}
            onChange={(event) => setNote(event.target.value)}
            placeholder="예) 유효기한 지남, 뚜껑 파손"
            className={styles.input}
          />
        </label>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {!asking ? (
        <button type="button" className={styles.disposeButton} onClick={() => setAsking(true)}>
          폐기 처리하기
        </button>
      ) : (
        <div className={styles.confirm}>
          <span className={styles.ask}>
            {name} #{id} 를 &quot;{method}&quot;(으)로 폐기 처리할까요? 처리하면 대여할 수 없어요.
          </span>
          <div className={styles.row}>
            <button type="button" className={styles.cancel} onClick={() => setAsking(false)} disabled={pending}>
              취소
            </button>
            <button type="button" className={styles.disposeFill} onClick={handleDispose} disabled={pending}>
              {pending ? "처리 중..." : "폐기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
