import { motion, AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface ToastItem { id: number; msg: string; }
interface Ctx { show: (msg: string) => void; }
const ToastCtx = createContext<Ctx>({ show: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems(p => [...p, { id, msg }]);
    setTimeout(() => setItems(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {items.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[12px] px-5 py-3.5 text-white text-[14px] font-[Proza_Libre] shadow-xl">
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function ToastEffectOnMount({ msg }: { msg: string }) {
  const { show } = useToast();
  useEffect(() => { show(msg); }, [msg, show]);
  return null;
}
