(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/(dashboard)/fournisseurs/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FournisseursPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const STATUTS = [
    "EN_ATTENTE",
    "VERIFIE",
    "SUSPENDU",
    "REJETE"
];
const STATUT_LABELS = {
    EN_ATTENTE: "En attente",
    VERIFIE: "Vérifiés",
    SUSPENDU: "Suspendus",
    REJETE: "Rejetés"
};
const NIVEAUX_LABEL = [
    "BRONZE",
    "ARGENT",
    "OR"
];
const LABEL_BADGE = {
    BRONZE: "bg-orange-100 text-orange-700",
    ARGENT: "bg-gray-200 text-gray-600",
    OR: "bg-semences/20 text-yellow-700"
};
function FournisseursPage() {
    _s();
    const [statut, setStatut] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("EN_ATTENTE");
    const [fournisseurs, setFournisseurs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [noteDrafts, setNoteDrafts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [actionPendingId, setActionPendingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const charger = (s)=>{
        setLoading(true);
        setError(null);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].get("/admin/fournisseurs", {
            statut: s,
            size: 50
        }).then((res)=>setFournisseurs(res.items)).catch((err)=>setError(err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] ? err.message : "Erreur de chargement")).finally(()=>setLoading(false));
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FournisseursPage.useEffect": ()=>{
            charger(statut);
        }
    }["FournisseursPage.useEffect"], [
        statut
    ]);
    const handleStatutAction = async (id, nouveauStatut)=>{
        const confirmLabel = nouveauStatut === "VERIFIE" ? "Valider ce fournisseur ?" : nouveauStatut === "SUSPENDU" ? "Suspendre ce fournisseur ?" : "Rejeter ce fournisseur ?";
        if (!window.confirm(confirmLabel)) return;
        setActionPendingId(id);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].patch(`/semences/fournisseurs/${id}/statut`, {
                statut: nouveauStatut,
                note_admin: noteDrafts[id]?.trim() || null
            });
            setFournisseurs((prev)=>prev.filter((f)=>f.id !== id));
        } catch (err) {
            alert(err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] ? err.message : "Action impossible");
        } finally{
            setActionPendingId(null);
        }
    };
    const handleLabel = async (id, niveau)=>{
        const confirmLabel = niveau ? `Attribuer le label ${niveau} ?` : "Retirer le Label Ivoire de ce fournisseur ?";
        if (!window.confirm(confirmLabel)) return;
        setActionPendingId(id);
        try {
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].patch(`/semences/fournisseurs/${id}/label-ivoire`, {
                label_ivoire: niveau,
                label_expire_le: null
            });
            setFournisseurs((prev)=>prev.map((f)=>f.id === id ? updated : f));
        } catch (err) {
            alert(err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] ? err.message : "Action impossible");
        } finally{
            setActionPendingId(null);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-gray-800",
                        children: "Fournisseurs"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Validation des fournisseurs & Label Ivoire Semences"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: STATUTS.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setStatut(s),
                        className: `rounded-full px-4 py-1.5 text-sm font-medium transition ${statut === s ? "bg-vertForet text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`,
                        children: STATUT_LABELS[s]
                    }, s, false, {
                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                        lineNumber: 102,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-gray-400",
                children: "Chargement..."
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                lineNumber: 116,
                columnNumber: 19
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-erreur",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                lineNumber: 117,
                columnNumber: 17
            }, this),
            !loading && !error && fournisseurs.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "rounded-xl bg-white p-6 text-center text-sm text-gray-400",
                children: [
                    "Aucun fournisseur ",
                    STATUT_LABELS[statut].toLowerCase(),
                    " pour le moment."
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                lineNumber: 120,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: fournisseurs.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl bg-white p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between gap-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-semibold text-gray-800",
                                                    children: f.nom_commercial
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                    lineNumber: 131,
                                                    columnNumber: 19
                                                }, this),
                                                f.label_ivoire && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_BADGE[f.label_ivoire]}`,
                                                    children: [
                                                        "Label ",
                                                        f.label_ivoire
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                    lineNumber: 133,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                            lineNumber: 130,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-1 text-sm text-gray-500",
                                            children: [
                                                f.region,
                                                f.ville ? ` · ${f.ville}` : ""
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                            lineNumber: 140,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-2 text-sm text-gray-600",
                                            children: [
                                                "Note ",
                                                f.note_moyenne.toFixed(1),
                                                "/5 · ",
                                                f.nombre_produits_actifs,
                                                " produits actifs"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                            lineNumber: 144,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                    lineNumber: 129,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                lineNumber: 128,
                                columnNumber: 13
                            }, this),
                            statut === "EN_ATTENTE" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 space-y-3 border-t border-gray-100 pt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: "Note admin (optionnel)",
                                        value: noteDrafts[f.id] ?? "",
                                        onChange: (e)=>setNoteDrafts((prev)=>({
                                                    ...prev,
                                                    [f.id]: e.target.value
                                                })),
                                        className: "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                        lineNumber: 152,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handleStatutAction(f.id, "VERIFIE"),
                                                disabled: actionPendingId === f.id,
                                                className: "rounded-lg bg-succes px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50",
                                                children: "Valider"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                lineNumber: 162,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handleStatutAction(f.id, "REJETE"),
                                                disabled: actionPendingId === f.id,
                                                className: "rounded-lg border border-erreur px-4 py-2 text-sm font-medium text-erreur transition hover:bg-erreur/5 disabled:opacity-50",
                                                children: "Rejeter"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                lineNumber: 169,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                        lineNumber: 161,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                lineNumber: 151,
                                columnNumber: 15
                            }, this),
                            statut === "VERIFIE" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 space-y-3 border-t border-gray-100 pt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mb-2 text-xs font-medium uppercase text-gray-400",
                                                children: "Label Ivoire Semences"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                lineNumber: 183,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: [
                                                    NIVEAUX_LABEL.map((niveau)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>handleLabel(f.id, niveau),
                                                            disabled: actionPendingId === f.id || f.label_ivoire === niveau,
                                                            className: `rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${f.label_ivoire === niveau ? "border-vertForet bg-vertForet/10 text-vertForet" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`,
                                                            children: niveau
                                                        }, niveau, false, {
                                                            fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                            lineNumber: 188,
                                                            columnNumber: 23
                                                        }, this)),
                                                    f.label_ivoire && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>handleLabel(f.id, null),
                                                        disabled: actionPendingId === f.id,
                                                        className: "rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-40",
                                                        children: "Retirer le label"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                        lineNumber: 202,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                                lineNumber: 186,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                        lineNumber: 182,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>handleStatutAction(f.id, "SUSPENDU"),
                                        disabled: actionPendingId === f.id,
                                        className: "rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50",
                                        children: "Suspendre"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                        lineNumber: 212,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                lineNumber: 181,
                                columnNumber: 15
                            }, this),
                            statut === "SUSPENDU" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 border-t border-gray-100 pt-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>handleStatutAction(f.id, "VERIFIE"),
                                    disabled: actionPendingId === f.id,
                                    className: "rounded-lg bg-succes px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50",
                                    children: "Réactiver"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                    lineNumber: 224,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                                lineNumber: 223,
                                columnNumber: 15
                            }, this)
                        ]
                    }, f.id, true, {
                        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                        lineNumber: 127,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/fournisseurs/page.tsx",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}
_s(FournisseursPage, "QWnLrWbNMOBW2YgppALe69CG2J4=");
_c = FournisseursPage;
var _c;
__turbopack_context__.k.register(_c, "FournisseursPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_%28dashboard%29_fournisseurs_page_tsx_0ul4xet._.js.map