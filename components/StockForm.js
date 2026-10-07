"use client";

// 재고 추가 입력 폼 (7차시)
// 저장 버튼을 누르면 서버의 addStock(actions.js)이 실행된다.
// 검사에 걸리면 항목 아래에 빨간 안내가 나오고, 입력한 값은 그대로 남는다.

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import styles from "./StockForm.module.css";
import { addStock } from "../app/stock/new/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "저장 중..." : "재고 추가하기"}
    </button>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.req}> *</span>}
      </label>
      {children}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export default function StockForm({ reagentNames, defaultReagent, locations, today, dbReady }) {
  const [state, formAction] = useFormState(addStock, null);
  const errors = state?.errors ?? {};
  const v = state?.values ?? {};

  // "아직 개봉 안 함" 체크 여부. 입력칸은 화면에 계속 남아 있으므로 값은 저절로 유지된다.
  const [isUnopened, setUnopened] = useState(false);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {!dbReady && (
        <div className={styles.warn}>
          DB(Supabase)가 연결되지 않아 지금은 저장할 수 없어요. <b>.env.local</b>을 확인하세요.
        </div>
      )}
      {state?.message && <div className={styles.alert}>{state.message}</div>}

      <Field label="시약" required error={errors.reagent}>
        <select name="reagent" className={styles.input} defaultValue={v.reagent ?? defaultReagent ?? ""}>
          <option value="">시약을 선택하세요</option>
          {reagentNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </Field>

      <div className={styles.twoCol}>
        <Field label="구매일" error={errors.purchased}>
          <input type="date" name="purchased" max={today} defaultValue={v.purchased ?? ""} className={styles.input} />
        </Field>

        <Field label="개봉일" required={!isUnopened} error={isUnopened ? undefined : errors.opened}>
          <input
            type="date"
            name="opened"
            max={today}
            defaultValue={v.opened ?? ""}
            disabled={isUnopened}
            className={styles.input}
          />
          <label className={styles.check}>
            <input
              type="checkbox"
              name="unopened"
                            onChange={(event) => setUnopened(event.target.checked)}
            />
            아직 개봉 안 함
          </label>
        </Field>
      </div>

      <Field label="유효기한" required error={errors.expires}>
        <input type="date" name="expires" defaultValue={v.expires ?? ""} className={styles.input} />
      </Field>

      <Field label="남은 양" required error={errors.amount}>
        <div className={styles.radios}>
          {["상", "중", "하"].map((level) => (
            <label key={level} className={styles.radio}>
              <input type="radio" name="amount" value={level} defaultChecked={(v.amount ?? "상") === level} />
              <span>{level}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field
        label="보관 위치 (시약장)"
        required
        error={errors.location}
        hint="예) A-1-2  ·  영문·숫자·하이픈(-)"
      >
        <input
          type="text"
          name="location"
          list="locations"
          defaultValue={v.location ?? ""}
          maxLength={12}
          placeholder="A-1-2"
          autoComplete="off"
          className={styles.input}
        />
        <datalist id="locations">
          {locations.map((place) => (
            <option key={place} value={place} />
          ))}
        </datalist>
      </Field>

      <Field label="비고" error={errors.note} hint="예) 잔량 적음, 환기 필요 (100자까지)">
        <textarea name="note" rows={3} maxLength={100} defaultValue={v.note ?? ""} className={styles.input} />
      </Field>

      <div className={styles.actions}>
        <Link href="/reagents" className={styles.cancel}>
          취소
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
