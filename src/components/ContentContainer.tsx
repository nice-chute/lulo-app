import { FC } from "react";
import Link from "next/link";
export const ContentContainer: FC = (props) => {
  return (
    <div className="flex-1 drawer h-52">
      <div className="flex flex-col items-center drawer-content">
        {props.children}
      </div>
    </div>
  );
};
