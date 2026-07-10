// ============================================================
// JOBFAST — STEP 2 PROFESSION SELECT
// Enterprise International Ready
//
// Rules:
// - No business logic
// - Centralized profession configuration
// - i18n ready
// - API migration ready
// - Backward compatible
// - Accessible
// - Enterprise scalable
// ============================================================

import React, {
  memo,
  useMemo,
  useCallback,
} from "react";

import {
  useTranslation,
} from "react-i18next";


import {
  getRoleConfig,
  getProfessionsByRole,
} from "../../config/roleConfig";
import { PROFESSION_METADATA } from "../../constants/categories";



// ============================================================
// LOCALIZED RESOLVER
// ============================================================

function getLocalizedLabel(
  item,
  language = "ht"
){

  if(!item){
    return "";
  }


  if(typeof item === "string"){
    return item;
  }


  const lang =
    language?.split("-")[0] || "ht";


  return (

    item.translations?.[lang] ||

    item.translations?.ht ||

    item.translations?.en ||

    item.displayName ||

    item.label ||

    item.name ||

    item.title ||

    item.id ||

    ""

  );

}




// ============================================================
// SELECT NORMALIZER
// Supports:
// - new object format
// - old string format
// ============================================================

function isProfessionSelected(
  selected,
  role,
  professionId
){

  if(!selected){
    return false;
  }


  if(typeof selected === "string"){

    return (
      selected ===
      `${role}:${professionId}`
    );

  }


  return (

    selected.role === role &&

    selected.professionId === professionId

  );

}




// ============================================================
// COMPONENT
// ============================================================

function Step2_ProfessionSelect({

  role,

  selected,

  onSelect,

  loading = false,

}){


  const {
    i18n,
    t
  } = useTranslation();




  // ==========================================================
  // ROLE CONFIG
  // ==========================================================

  const roleConfig = useMemo(()=>{

    try{

      return role
      ? getRoleConfig(role)
      : null;

    }

    catch(error){

      console.error(
        "JOBFAST role config error:",
        error
      );

      return null;

    }


  },[role]);




  // ==========================================================
  // PROFESSIONS
  // ==========================================================

  const professions = useMemo(()=>{

    try{

      if(!role){
        return [];
      }

      const data = getProfessionsByRole(role);

      if(!Array.isArray(data)){
        return [];
      }

      return data
        .map(item => {
          // getProfessionsByRole returns string keys — map to metadata objects
          if(typeof item === "string"){
            const meta = PROFESSION_METADATA[item];
            return meta ? { id: item, ...meta } : null;
          }
          // Already an object with id (future-proof)
          return item?.id ? item : null;
        })
        .filter(Boolean);

    }

    catch(error){

      console.error(
        "JOBFAST profession loading error:",
        error
      );

      return [];

    }

  },[role]);




  // ==========================================================
  // SELECT ACTION
  // ==========================================================

  const handleSelect =
  useCallback(

    (profession)=>{


      if(
        loading ||
        !profession?.id
      ){

        return;

      }



      if(
        typeof onSelect !== "function"
      ){

        return;

      }




      onSelect({

        role,

        professionId:
        profession.id,


        category:

          profession.category ??

          profession.profession ??

          "general"


      });



    },

    [
      role,
      loading,
      onSelect
    ]

  );




  // ==========================================================
  // LOADING
  // ==========================================================

  if(loading){

    return (

      <div

        className="
        w-full
        text-center
        text-gray-400
        py-8
        "

        aria-live="polite"

      >

        {
          t(
            "common.loading"
          )
        }


      </div>

    );

  }




  return (

    <div

      className="w-full"

      data-testid="profession-selector"

    >




      <p

        className="
        text-sm
        text-gray-300
        mb-4
        text-center
        "

      >

        {
          t(
            "registration.choose_profession",
            {

              role:

              getLocalizedLabel(
                roleConfig,
                i18n.language
              )

              ||

              role

            }
          )
        }


      </p>




      <div

        role="listbox"

        aria-label={
          t(
            "registration.profession_list"
          )
        }

        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-4
        "

      >




      {
        professions.map(
        (profession)=>{


          const selectedState =
          isProfessionSelected(
            selected,
            role,
            profession.id
          );



          const name =
          getLocalizedLabel(
            profession,
            i18n.language
          );



          const key =
          `${role}:${profession.id}`;




          return (

            <button


              key={key}


              type="button"


              role="option"


              aria-selected={
                selectedState
              }


              aria-label={
                name
              }



              disabled={loading}



              onClick={()=>
                handleSelect(
                  profession
                )
              }



              className={`

              p-5

              rounded-xl

              border-2

              text-left

              transition-all

              duration-200


              focus-visible:outline-none

              focus-visible:ring-2

              focus-visible:ring-yellow-400


              ${
                selectedState

                ?

                "border-yellow-400 bg-yellow-400/10 scale-105"

                :

                "border-gray-600 bg-gray-700/30 hover:border-yellow-400/50"

              }

              `}


            >




            {
              profession.icon && (

                <div

                  className="
                  text-3xl
                  mb-3
                  "

                >

                  {profession.icon}

                </div>

              )

            }




            <h3

              className="
              text-sm
              font-bold
              leading-tight
              "

            >

              {name}


            </h3>




            {
              profession.description && (

                <p

                  className="
                  text-xs
                  text-gray-400
                  mt-2
                  "

                >

                {
                  getLocalizedLabel(
                    profession.description,
                    i18n.language
                  )
                }


                </p>

              )

            }




            </button>


          );


        })

      }



      </div>




      {
        professions.length === 0 && (

          <p

            className="
            text-center
            text-gray-400
            text-sm
            py-8
            "

          >

          {
            t(
              "registration.no_professions"
            )
          }


          </p>

        )
      }




    </div>

  );


}



export default memo(
  Step2_ProfessionSelect
);
