import { useComponentCount } from "@/contexts/ComponentCount";
import Welcome from "./welcome/page";
import HomeScreen from "./home/page";
import PopupCard from "@/dialogs/PopupCard";
// import OrderFooter from "@/dialogs/OrderFooter";
import OrderScreen from "./vieworder/page";
import PhoneNumberForm from "./addphonenumber/page";
import Processing from "./processing/page";
import PaymentSuccess from "./paymentsucess/page";
import MenuItem from "./menuItems/page";
import PayLater from "./paylater/page";

export default function Home() {
  const { currentComponentCount, categoryId } = useComponentCount();

  return (
    <div>
      {(currentComponentCount === 1 || currentComponentCount === 3) && (
        <Welcome />
      )}
      {currentComponentCount === 3 && <PopupCard />}
      {currentComponentCount === 4 && <HomeScreen />}
      {currentComponentCount === 5 && <OrderScreen />}
      {currentComponentCount === 6 && <PhoneNumberForm />}
      {currentComponentCount === 7 && <Processing />}
      {currentComponentCount === 8 && <PaymentSuccess />}
      {currentComponentCount === 9 && <MenuItem categoryId={categoryId}/>}
       {currentComponentCount === 10 && <PayLater />}
    </div>
  );
}
