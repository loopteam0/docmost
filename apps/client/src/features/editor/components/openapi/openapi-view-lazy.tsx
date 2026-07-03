import { lazy, Suspense } from "react";
import { NodeViewProps } from "@tiptap/react";

const OpenApiView = lazy(
  () => import("@/features/editor/components/openapi/openapi-view.tsx"),
);

export default function OpenApiViewLazy(props: NodeViewProps) {
  return (
    <Suspense fallback={null}>
      <OpenApiView {...props} />
    </Suspense>
  );
}
