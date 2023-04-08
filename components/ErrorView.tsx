import { useTranslation } from "@/app/i18n/client";
import { useEffect, useState } from "react";

export default function ErrorView({ error }: { error: any }) {
    const [msg, setMsg] = useState<string>("")
    const { t } = useTranslation()

    useEffect(() => {
        if (typeof error === "object") {
            return setMsg((error as Object).toString())
        }
        setMsg(error)
    }, [error])
    return (
        <div className="text-center mt-28">
            <p className="text-2xl font-bold">{t('an-error-has-occurred')}</p>
            <p className="text-sm">{msg}</p>
        </div>
    )
}