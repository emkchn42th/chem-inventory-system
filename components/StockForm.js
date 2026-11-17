"use client";

// 재고 입력 폼 (7차시: 추가, 추가 기능 단계: 수정에도 같이 씀)
// 저장 버튼을 누르면 서버 함수(action)가 실행된다.
//   추가 : app/stock/new/actions.js 의 addStock
//   수정 : app/stock/[id]/edit/actions.js 의 updateStock
// 검사에 걸리면 항목 아래에 빨간 안내가 나오고, 입력한 값은 그대로 남는다.

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { UNITS, levelFromRatio } from "../lib/amount";
import styles from "./StockForm.module.css";

function SubmitButton({ label }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "저장 중..." : label}
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

// mode    : "add"(추가) 또는 "edit"(수정)
// initial : 수정할 때 처음 채워 둘 값 { id, reagent, purchased, opened, unopened, expires, amount, location, note }
export default function StockForm({
  action,
  mode = "add",
  initial = {},
  reagentNames,
  defaultReagent,
  locations,
  today,
  dbReady,
  cancelHref = "/reagents",
}) {
  const [state, formAction] = useFormState(action, null);
  const errors = state?.errors ?? {};
  const v = state?.values ?? initial;
  const isEdit = mode === "edit";

  // "아직 개봉 안 함" 체크 여부. 입력칸은 화면에 계속 남아 있으므로 값은 저절로 유지된다.
  const [isUnopened, setUnopened] = useState(Boolean(initial.unopened));

  // 남은 양 기록 방식: 정성(상/중/하) 또는 정량(숫자)
  const [amountMode, setAmountMode] = useState(v.amountMode ?? initial.amountMode ?? "정성");
  // 정량 입력 미리보기용 (몇 % 남았는지, 상/중/하 중 무엇인지)
  const [quant, setQuant] = useState({ value: v.amountValue ?? "", capacity: v.capacity ?? "" });
  const ratio = Number(quant.value) / Number(quant.capacity);
  const preview =
    quant.value !== "" && Number(quant.capacity) > 0 && Number.isFinite(ratio) && ratio >= 0 && ratio <= 1
      ? `${Math.round(ratio * 100)}% 남음 · 자동으로 '${levelFromRatio(ratio)}'(으)로 표시돼요`
      : "";

  return (
    <form action={formAction} className={styles.form} noValidate>
      {!dbReady && (
        <div className={styles.warn}>
          DB(Supabase)가 연결되지 않아 지금은 저장할 수 없어요. <b>.env.local</b>을 확인하세요.
        </div>
      )}
      {state?.message && <div className={styles.alert}>{state.message}</div>}

      {isEdit && <input type="hidden" name="id" value={initial.id} />}

      <Field
        label="시약"
        required
        error={errors.reagent}
        hint={isEdit ? "시약 종류는 바꿀 수 없어요. 다른 시약이면 지우고 새로 추가하세요." : undefined}
      >
        <select
          name="reagent"
          className={styles.input}
          defaultValue={v.reagent ?? defaultReagent ?? ""}
          disabled={isEdit}
        >
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
              defaultChecked={Boolean(initial.unopened)}
              onChange={(event) => setUnopened(event.target.checked)}
            />
            아직 개봉 안 함
          </label>
        </Field>
      </div>

      <Field label="유효기한" required error={errors.expires}>
        <input type="date" name="expires" defaultValue={v.expires ?? ""} className={styles.input} />
      </Field>

      <Field label="남은 양" required error={amountMode === "정성" ? errors.amount : undefined}>
        {/* 기록 방식 고르기 */}
        <input type="hidden" name="amountMode" value={amountMode} />
        <div className={styles.modeSwitch} role="radiogroup" aria-label="남은 양 기록 방식">
          {[
            { key: "정성", label: "정성 · 상/중/하", hint: "눈으로 대충 볼 때" },
            { key: "정량", label: "정량 · 숫자", hint: "눈금·저울로 잴 때" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={amountMode === item.key}
              className={`${styles.modeButton} ${amountMode === item.key ? styles.modeActive : ""}`}
              onClick={() => setAmountMode(item.key)}
            >
              <b>{item.label}</b>
              <span>{item.hint}</span>
            </button>
          ))}
        </div>

        {amountMode === "정성" ? (
          <div className={styles.radios}>
            {["상", "중", "하"].map((level) => (
              <label key={level} className={styles.radio}>
                <input type="radio" name="amount" value={level} defaultChecked={(v.amount ?? "상") === level} />
                <span>{level}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className={styles.quant}>
            <label className={styles.quantField}>
              <span>남은 양</span>
              <input
                type="number"
                name="amountValue"
                inputMode="decimal"
                min="0"
                step="any"
                defaultValue={v.amountValue ?? ""}
                onChange={(event) => setQuant((q) => ({ ...q, value: event.target.value }))}
                className={styles.input}
                placeholder="350"
              />
            </label>
            <span className={styles.slash}>/</span>
            <label className={styles.quantField}>
              <span>전체 용량</span>
              <input
                type="number"
                name="capacity"
                inputMode="decimal"
                min="0"
                step="any"
                defaultValue={v.capacity ?? ""}
                onChange={(event) => setQuant((q) => ({ ...q, capacity: event.target.value }))}
                className={styles.input}
                placeholder="500"
              />
            </label>
            <label className={styles.quantField}>
              <span>단위</span>
              <select name="unit" defaultValue={v.unit ?? "mL"} className={styles.input}>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {amountMode === "정량" && (errors.amountValue || errors.capacity || errors.unit) && (
          <p className={styles.error}>{errors.amountValue || errors.capacity || errors.unit}</p>
        )}
        {amountMode === "정량" && !errors.amountValue && !errors.capacity && preview && (
          <p className={styles.hint}>{preview}</p>
        )}
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
        <Link href={cancelHref} className={styles.cancel}>
          취소
        </Link>
        <SubmitButton label={isEdit ? "수정 저장" : "재고 추가하기"} />
      </div>
    </form>
  );
}
