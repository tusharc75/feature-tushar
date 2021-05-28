import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

export const ViewAll = ({ type, relatedTo }) => {
  let filter = relatedTo.filter((_relatedTo) => _relatedTo.access === true);
  return filter.length > 0 ? (
    <Link
      to={
        `${type === "event" ? "/calendar?" : "/"}` +
        `${type === "event" ? "type=event" : type}` +
        `${type === "event" ? "&" : "?"}referenceType=` +
        filter[0].type +
        "&referenceId=" +
        filter[0].referenceId
      }
    >
      <span
        className="btn-view gap-1"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 6,
          paddingBottom: 6,
        }}
      >
        <FaEye /> View All
      </span>
    </Link>
  ) : null;
};
