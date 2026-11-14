import { Redirect } from "wouter";

/** Keep legacy links working without exposing unprovided bundle products. */
export default function BundlesPage() {
  return <Redirect to="/shop/wigs" />;
}
