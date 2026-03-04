"use client";

import { useEffect, useState, useRef } from "react";
import AdminHeader from "@/components/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

type PresetItem = {
  id: string;
  label: string;
  prompt: string;
  prompt_midjourney?: string | null;
  prompt_nano_banana?: string | null;
  image_url?: string | null;
};
type PresetsResponse = { female: PresetItem[]; male: PresetItem[] };

/** 프리셋별 컨셉 설명 */
const PRESET_CONCEPTS: Record<string, string> = {
  professional: "진지하고 신뢰감 있는 스타일. 밝은 회색 배경, 부드러운 자연스러운 미소.",
  friendly: "따뜻하고 친근한 분위기. 베이지 배경, 환한 미소로 접근성 강조.",
  modern: "깔끔하고 세련된 스타일. 흰색 배경, 차분하고 자신감 있는 표정.",
};

/** 의사 프로필 사진용 기본 프리셋 3종 (여성/남성).*/
const DEFAULT_PRESETS: PresetsResponse = {
  female: [
    {
      id: "professional",
      label: "프로페셔널",
      prompt: "professional medical headshot of korean female doctor without glasses, white lab coat, arms crossed, warm natural smile, light gray background, soft studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_midjourney: "professional medical headshot, preserve exact facial identity from reference image, no facial modification, natural skin texture visible, subtle professional retouch only, korean female doctor without glasses, white lab coat, arms crossed, warm natural smile, light gray background, soft diffused studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_nano_banana: "professional medical headshot, preserve exact facial identity from reference image, retain original skin texture, subtle skin cleanup only, minor blemish removal only, korean female doctor without glasses, white lab coat, arms crossed, warm natural smile, light gray background, soft studio lighting"
    },
    {
      id: "friendly",
      label: "친근한",
      prompt: "warm friendly medical headshot of korean female doctor without glasses, white lab coat, arms crossed, warm natural smile, light beige background, soft warm studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_midjourney: "warm friendly medical headshot, preserve exact facial identity from reference image, no facial modification, natural skin texture visible, subtle professional retouch only, korean female doctor without glasses, white lab coat, arms crossed, warm natural smile, light beige background, soft diffused warm studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_nano_banana: "warm friendly medical headshot, preserve exact facial identity from reference image, retain original skin texture, subtle skin cleanup only, minor blemish removal only, korean female doctor without glasses, white lab coat, arms crossed, warm natural smile, light beige background, soft warm studio lighting"
    },
    {
      id: "modern",
      label: "모던",
      prompt: "modern clean medical headshot of korean female doctor without glasses, white lab coat, arms crossed, calm confident expression, white background, soft studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_midjourney: "modern clean medical headshot, preserve exact facial identity from reference image, no facial modification, natural skin texture visible, subtle professional retouch only, korean female doctor without glasses, white lab coat, arms crossed, calm confident expression, white background, soft diffused studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_nano_banana: "modern clean medical headshot, preserve exact facial identity from reference image, retain original skin texture, subtle skin cleanup only, minor blemish removal only, korean female doctor without glasses, white lab coat, arms crossed, calm confident expression, white background, soft studio lighting"
    }
  ],
  male: [
    {
      id: "professional",
      label: "프로페셔널",
      prompt: "RAW photo, professional medical headshot of korean male doctor without glasses, white lab coat over dress shirt, arms crossed, natural confident smile, light gray background, soft studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_midjourney: "professional medical headshot, preserve exact facial identity from reference image, no facial modification, natural skin texture visible, subtle professional retouch only, korean male doctor without glasses, white lab coat over dress shirt, arms crossed, natural confident smile, light gray background, soft diffused studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_nano_banana: "professional medical headshot, preserve exact facial identity from reference image, retain original skin texture, subtle skin cleanup only, minor blemish removal only, korean male doctor without glasses, white lab coat over dress shirt, arms crossed, natural confident smile, light gray background, soft studio lighting",
    },
    {
      id: "friendly",
      label: "친근한",
      prompt: "RAW photo, warm friendly medical headshot of korean male doctor without glasses, white lab coat over dress shirt, arms crossed, bright warm smile, light beige background, soft warm lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_midjourney: "warm friendly medical headshot, preserve exact facial identity from reference image, no facial modification, natural skin texture visible, subtle professional retouch only, korean male doctor without glasses, white lab coat over dress shirt, arms crossed, bright warm smile, light beige background, soft diffused warm lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_nano_banana: "warm friendly medical headshot, preserve exact facial identity from reference image, retain original skin texture, subtle skin cleanup only, minor blemish removal only, korean male doctor without glasses, white lab coat over dress shirt, arms crossed, bright warm smile, light beige background, soft warm lighting",
    },
    {
      id: "modern",
      label: "모던",
      prompt: "RAW photo, modern clean medical headshot of korean male doctor without glasses, sleek white lab coat, arms crossed, calm confident expression, white background, crisp studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_midjourney: "modern clean medical headshot, preserve exact facial identity from reference image, no facial modification, natural skin texture visible, subtle professional retouch only, korean male doctor without glasses, sleek white lab coat, arms crossed, calm confident expression, white background, soft diffused studio lighting, 85mm --style raw --s 10 --v 6.1 --ar 3:4",
      prompt_nano_banana: "modern clean medical headshot, preserve exact facial identity from reference image, retain original skin texture, subtle skin cleanup only, minor blemish removal only, korean male doctor without glasses, sleek white lab coat, arms crossed, calm confident expression, white background, crisp studio lighting",
    },
  ],
};

function PresetBlock({
  gender,
  presets,
  uploading,
  fileInputRefs,
  onUpload,
  onUpdatePrompt,
  onUpdatePromptField,
}: {
  gender: "female" | "male";
  presets: PresetItem[];
  uploading: string | null;
  fileInputRefs: React.RefObject<Record<string, HTMLInputElement | null>>;
  onUpload: (gender: "female" | "male", index: number, file: File) => void;
  onUpdatePrompt: (gender: "female" | "male", index: number, value: string) => void;
  onUpdatePromptField: (gender: "female" | "male", index: number, field: "prompt_midjourney" | "prompt_nano_banana", value: string) => void;
}) {
  const title = gender === "female" ? "여성 프리셋" : "남성 프리셋";
  const emptyMsg = gender === "female" ? "등록된 여성 프리셋이 없습니다." : "등록된 남성 프리셋이 없습니다.";
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {presets.map((preset, index) => (
          <div key={preset.id} className="border rounded-lg p-4 space-y-2 bg-gray-50/50">
            <div className="mb-3 pb-2 border-b border-gray-200">
              <h3 className="font-semibold text-base">{preset.label}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{PRESET_CONCEPTS[preset.id] ?? ""}</p>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">대표 이미지</Label>
                <label
                  htmlFor={`upload-${gender}-${index}`}
                  className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-100 transition-colors relative block"
                >
                  <input
                    id={`upload-${gender}-${index}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    ref={(el) => { fileInputRefs.current[`${gender}-${index}`] = el; }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(gender, index, f); }}
                    disabled={uploading === `${gender}-${index}`}
                  />
                  {uploading === `${gender}-${index}` ? (
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                  ) : preset.image_url ? (
                    <Image src={preset.image_url} alt={preset.label} width={96} height={96} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-400" />
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">공통 프롬프트 (모델별 비우면 이걸 사용)</Label>
              <Textarea
                value={preset.prompt}
                onChange={(e) => onUpdatePrompt(gender, index, e.target.value)}
                placeholder="RAW photo, ..."
                rows={2}
                className="w-full resize-y text-sm font-mono"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">미드저니용</Label>
                <Textarea
                  value={preset.prompt_midjourney ?? ""}
                  onChange={(e) => onUpdatePromptField(gender, index, "prompt_midjourney", e.target.value)}
                  placeholder="natural skin, minimal retouching..."
                  rows={2}
                  className="w-full resize-y text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">나노바나나용</Label>
                <Textarea
                  value={preset.prompt_nano_banana ?? ""}
                  onChange={(e) => onUpdatePromptField(gender, index, "prompt_nano_banana", e.target.value)}
                  placeholder="soft polished, natural look..."
                  rows={2}
                  className="w-full resize-y text-sm font-mono"
                />
              </div>
            </div>
          </div>
        ))}
        {presets.length === 0 && (
          <p className="text-sm text-gray-500">{emptyMsg} 기본값 불러오기를 눌러 추가하세요.</p>
        )}
      </div>
    </Card>
  );
}

const MODEL_OPTIONS = [
  { id: "midjourney", label: "Midjourney" },
  { id: "nano_banana", label: "Nano Banana" },
] as const;

export default function ProfilePhotoPresetsPage() {
  const [presets, setPresets] = useState<PresetsResponse>({ female: [], male: [] });
  const [selectedModels, setSelectedModels] = useState<string[]>(["midjourney", "nano_banana"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const [presetsRes, configRes] = await Promise.all([
        fetch("/manager-api/profile-photo/presets"),
        fetch("/manager-api/profile-photo/config"),
      ]);
      const presetsData = await presetsRes.json();
      const configData = await configRes.json();
      if (presetsRes.ok && presetsData?.female && presetsData?.male) {
        setPresets({ female: presetsData.female, male: presetsData.male });
      } else {
        setPresets({ female: [], male: [] });
      }
      if (configRes.ok && Array.isArray(configData?.selected_models)) {
        setSelectedModels(configData.selected_models);
      }
    } catch {
      setPresets({ female: [], male: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      const next = prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id];
      return next.length >= 1 ? next : prev;
    });
  };

  const updatePreset = (gender: "female" | "male", index: number, field: keyof PresetItem, value: string | null) => {
    setPresets((prev) => {
      const list = [...prev[gender]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [gender]: list };
    });
  };

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleImageUpload = async (gender: "female" | "male", index: number, file: File) => {
    const preset = presets[gender][index];
    if (!preset) return;
    const key = `${gender}-${index}`;
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("gender", gender);
      formData.append("preset_id", preset.id);
      const res = await fetch("/manager-api/profile-photo/presets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        updatePreset(gender, index, "image_url", data.url);
      } else {
        alert(data?.error || "업로드에 실패했습니다.");
      }
    } catch {
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(null);
      const input = fileInputRefs.current[key];
      if (input) input.value = "";
    }
  };

  /** 기본값으로 리셋 후 바로 저장 */
  const loadDefaults = async () => {
    if (!confirm("기본값으로 리셋할까요?")) return;
    const payload = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
    try {
      setSaving(true);
      const res = await fetch("/manager-api/profile-photo/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setPresets(payload);
        alert("기본값으로 리셋했습니다.");
      } else {
        alert(data?.error || "저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/manager-api/profile-photo/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presets),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "저장에 실패했습니다.");
        return;
      }
      const configRes = await fetch("/manager-api/profile-photo/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_models: selectedModels }),
      });
      if (!configRes.ok) {
        const configData = await configRes.json();
        alert("프리셋은 저장되었으나 모델 설정 저장 실패: " + (configData?.error ?? ""));
        return;
      }
      alert("저장되었습니다. 선택한 모델이 사용자 페이지에 적용됩니다.");
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader currentPath="/manager/profile-photo" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentPath="/manager/profile-photo" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI 프로필 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              의사 프로필 사진용 스타일 3종을 관리합니다. 대표 이미지를 올리면 사용자 페이지에 그대로 노출됩니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadDefaults}>
              기본값으로 리셋
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">사용 모델</h2>
            <p className="text-sm text-gray-500 mb-4">선택한 모델이 사용자 페이지 AI 프로필 생성에 적용됩니다. 둘 다 선택하면 두 장 생성됩니다.</p>
            <div className="flex flex-wrap gap-4">
              {MODEL_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(opt.id)}
                    onChange={() => toggleModel(opt.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </Card>

          <PresetBlock
            gender="female"
            presets={presets.female}
            uploading={uploading}
            fileInputRefs={fileInputRefs}
            onUpload={handleImageUpload}
            onUpdatePrompt={(g, i, v) => updatePreset(g, i, "prompt", v)}
            onUpdatePromptField={(g, i, field, v) => updatePreset(g, i, field, v)}
          />
          <PresetBlock
            gender="male"
            presets={presets.male}
            uploading={uploading}
            fileInputRefs={fileInputRefs}
            onUpload={handleImageUpload}
            onUpdatePrompt={(g, i, v) => updatePreset(g, i, "prompt", v)}
            onUpdatePromptField={(g, i, field, v) => updatePreset(g, i, field, v)}
          />
        </div>
      </div>
    </div>
  );
}
