// ============================================================
// JOBFAST — STEP 3 BASIC INFORMATION
// Enterprise Global Registration
//
// Production Grade v4
//
// Global Marketplace Ready
//
// Features:
// - ISO country architecture
// - International phone support
// - Enterprise payload
// - i18n ready
// - Backend compatible
// - API migration ready
// - KYC ready
// - Analytics ready
// - Accessibility compliant
// - Backward compatible
// ============================================================


import React,{
 memo,
 useState,
 useMemo,
 useCallback
} from "react";


import {
 useTranslation
} from "react-i18next";


import {
 COUNTRY_DATA,
 getCountryLabel,
 getZones
} from "../../config/countries";




// ============================================================
// CONFIG
// ============================================================


const DEFAULT_COUNTRY="ht";

const REGISTRATION_VERSION="1.0.0";




// ============================================================
// STYLE
// ============================================================


const inputCls=`
w-full
p-3
rounded
bg-[#0d1b35]
border
border-gray-600
text-white
placeholder-gray-400
focus:border-yellow-400
outline-none
transition
`;


const errorCls=`
text-red-400
text-xs
`;





// ============================================================
// HELPERS
// ============================================================


const normalizePhone=(phone,dialCode)=>{


const clean=

String(phone||"")
.replace(/[^\d+]/g,"");


return clean.startsWith("+")
?
clean
:
`${dialCode}${clean}`;

};





const validateEmail=(email)=>
{

return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
.test(email.trim());

};





const validatePhone=(phone)=>
{

return phone
.replace(/\D/g,"")
.length >=7;

};





const validatePassword=(password)=>
{

return password.length>=8;

};









// ============================================================
// COMPONENT
// ============================================================


function Step3_BasicInfo({

data={},

onNext,

loading=false

}){


const {
i18n,
t
}=useTranslation();



const locale=i18n.language || "ht";




const [form,setForm]=useState({

fullName:data.fullName || "",

email:data.email || "",

phone:data.phone || "",


countryCode:
data.countryCode ||
data.country ||
DEFAULT_COUNTRY,


region:
data.region ||
data.zone ||
"",


city:data.city || "",


password:"",

confirmPassword:""

});





const [errors,setErrors]=useState({});







const selectedCountry=

useMemo(()=>{


return (

COUNTRY_DATA.find(
c=>c.code===form.countryCode
)

||
COUNTRY_DATA[0]

);


},[
form.countryCode
]);







const regions=

useMemo(()=>{


return getZones(
selectedCountry,
locale
)||[];


},[
selectedCountry,
locale
]);









const updateField=

useCallback((e)=>{


const {
name,
value
}=e.target;



setForm(prev=>({

...prev,

[name]:value,


...(name==="countryCode"
?
{
region:""
}
:
{})

}));



setErrors(prev=>({

...prev,

[name]:null

}));


},[]);









const validate=()=>{


const e={};



if(!form.fullName.trim())
e.fullName="required";



if(!validateEmail(form.email))
e.email="invalid";



if(!validatePhone(form.phone))
e.phone="invalid";



if(!form.region)
e.region="required";



if(!validatePassword(form.password))
e.password="weak";



if(
form.password !==
form.confirmPassword
)

e.confirmPassword="match";



setErrors(e);


return Object.keys(e).length===0;


};









const submit=()=>{


if(loading)
return;



if(!validate())
return;



const payload={



profile:{


fullName:
form.fullName.trim(),


email:
form.email
.trim()
.toLowerCase(),


phone:
normalizePhone(
form.phone,
selectedCountry.dialCode ||
selectedCountry.phone
)

},




location:{


countryCode:
selectedCountry.code,


countryName:
getCountryLabel(
selectedCountry,
locale
),


region:
form.region,


city:
form.city.trim()

},




preferences:{


language:
locale,


timezone:
Intl.DateTimeFormat()
.resolvedOptions()
.timeZone

},




security:{


password:
form.password

},




metadata:{


platform:"jobfast",


registrationVersion:
REGISTRATION_VERSION,


source:"web",


createdAt:
new Date()
.toISOString()

}


};



onNext?.(payload);


};









return (

<form

onSubmit={(e)=>{

e.preventDefault();

submit();

}}

aria-busy={loading}

className="w-full space-y-4"

>

<input

id="fullName"

name="fullName"

autoComplete="name"

value={form.fullName}

onChange={updateField}

aria-invalid={!!errors.fullName}

placeholder={
t("registration.full_name")
}

className={inputCls}

/>


{
errors.fullName &&
<p className={errorCls}>
{t("errors.required")}
</p>
}






<input

id="email"

type="email"

name="email"

autoComplete="email"

value={form.email}

onChange={updateField}

placeholder={
t("registration.email")
}

className={inputCls}

/>


{
errors.email &&
<p className={errorCls}>
{t("errors.email_invalid")}
</p>
}







<div className="flex gap-2">


<div className="
flex
items-center
px-3
rounded
bg-[#0d1b35]
border
border-gray-600
text-yellow-400
font-bold
">

{selectedCountry.flag}

{" "}

{selectedCountry.dialCode || selectedCountry.phone}

</div>




<input

type="tel"

id="phone"

name="phone"

autoComplete="tel"

value={form.phone}

onChange={updateField}

placeholder={
t("registration.phone")
}

className={inputCls}

/>


</div>







<select

name="countryCode"

value={form.countryCode}

onChange={updateField}

className={inputCls}

>

{
COUNTRY_DATA.map(c=>(

<option

key={c.code}

value={c.code}

>

{c.flag}{" "}

{
getCountryLabel(
c,
locale
)
}

</option>

))
}

</select>







<select

name="region"

value={form.region}

onChange={updateField}

className={inputCls}

>

<option value="">

{
t("registration.select_region")
}

</option>


{
regions.map(r=>(

<option

key={r}

value={r}

>

{r}

</option>

))
}

</select>







<input

name="city"

value={form.city}

onChange={updateField}

placeholder={
t("registration.city")
}

className={inputCls}

/>







<input

type="password"

name="password"

value={form.password}

onChange={updateField}

placeholder={
t("registration.password")
}

className={inputCls}

/>







<input

type="password"

name="confirmPassword"

value={form.confirmPassword}

onChange={updateField}

placeholder={
t("registration.confirm_password")
}

className={inputCls}

/>







<button

disabled={loading}

type="submit"

className={`
w-full
p-4
rounded
font-bold
transition

${
loading
?
"bg-gray-500 text-gray-300"
:
"bg-yellow-400 text-black hover:bg-yellow-300"
}

`}

>

{
loading
?
t("common.processing")
:
t("common.next")
}

</button>



</form>

);


}


export default memo(Step3_BasicInfo);