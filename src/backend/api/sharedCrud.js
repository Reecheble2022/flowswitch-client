import { appiiSlice } from "./apiSlice";
import { sub } from 'date-fns';
import { getWebSocketInstance } from './websocketConnection';

const isValidJsonString = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}

export const sharedCrudApi = appiiSlice.injectEndpoints({
  endpoints: builder => ({

    //________________________________
    userLogin: builder.mutation({
      query: ({ data }) => {
        return ({
          url: `/auth/login`,
          method: "POST",
          body: data,
        })
      },
      transformResponse: (response, _, { defaultProfileAfterLogin }) => {
        const { token, user, accessToken, refreshToken, } = response.data || {}
        const { access_token, refresh_token } = token || {}
        const { profileIds } = user || {}
        return {
          user,
          profileIds,
          access_token: access_token || accessToken,
          refresh_token: refresh_token || refreshToken,
          defaultProfileAfterLogin,
        }
      },
    }),

    //______________________________________
    googleLogin: builder.mutation({
      query: (body) => {
        return ({
          url: `/auth/google-login`,
          method: "POST",
          body,
        })
      },
    }),

    //_______________________________________
    userLoginResendOTP: builder.mutation({
      query: ({ data }) => ({
        url: "/auth/resend-verification-otp",
        method: "POST",
        body: data,
      }),
    }),

    //________________________________
    otpVerifier: builder.mutation({
      query: ({ data }) => {
        return ({
          url: "/auth/verify-otp",
          method: "POST",
          body: data,
        })
      },
      transformResponse: (response, _, { defaultProfileAfterLogin }) => {
        const { token, user, profiles, accessToken, refreshToken, } = response.data || {}
        const { access_token, refresh_token } = token || {}
        const { profileIds } = user || {}
        return {
          user,
          profileIds,
          access_token: access_token || accessToken,
          refresh_token: refresh_token || refreshToken,
          defaultProfileAfterLogin,
          profiles
        }
      },
    }),

    //________________________________
    otpSmsSender: builder.mutation({
      query: ({ data }) => ({
        url: "/auth/send-to-phone",
        method: "POST",
        body: data,
      }),
    }),

    //________________________________
    otpEmailSender: builder.mutation({
      query: ({ data }) => ({
        url: "/auth/send-to-email",
        method: "POST",
        body: data,
      }),
    }),

    //______________________________________________
    listOptions: builder.query({
      query: ({ entity, page = 1, limit = 200 }) => `/${entity}/options?page=${page}&limit=${limit}`,
      transformResponse: ({ Message, data }, _, { entity }) => {
        return { entity, Data: data, Message }
      },
    }),

    //______________________________________________
    listOptionz: builder.mutation({
      query: ({ entity, page = 1, limit = 200 }) => ({
        url: `/${entity}/options?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      transformResponse: ({ Message, Data }, _, { entity }) => {
        return { entity, Data, Message }
      },
    }),

    //______________________________________________
    itemRegistrer: builder.mutation({
      query: ({ entity, submissionEndpoint, data }) => {
        const url = `/${submissionEndpoint || entity}`
        return ({
          url,
          method: "POST",
          body: data,
        })
      },
      transformResponse: (response, _, { entity }) => {
        const { data, msg } = response || {}
        return { entity, Data: data, Message: msg }
      }
    }),

    //______________________________________________
    fileUploader: builder.mutation({
      query: ({ entity, submissionEndpoint, data }) => {
        const url = `/${submissionEndpoint || entity}`
        return ({
          url,
          method: "POST",
          body: data,
        })
      },
      transformResponse: (response, _, { entity }) => {
        const { data, msg } = response || {}
        return { entity, Data: data, Message: msg }
      }
    }),

    //______________________________________________
    itemsListReader: builder.query({
      query: ({ entity, page = 1, max = 100, filters }) => {
        let targetURL = `/${entity}?page=${page}&limit=${max}`
        if (filters && Object.keys(filters).length > 0) {
          const searchParams = new URLSearchParams(filters);
          const params = searchParams.toString();
          targetURL = `/${entity}?page=${page}&limit=${max}&${params}`
        }
        return targetURL;
      },
      transformResponse: ({ data }, _, { entity }) => {
        const { list, pagination: { totalCount, totalPages, currentPage } = {} } = data || {};
        const processedListData = (list || []).map(item => ({
          ...item,
          createdAt: item.createdAt || sub(new Date(), { minutes: 1 }).toISOString(),
          created_at: item.created_at || sub(new Date(), { minutes: 1 }).toISOString(),
          reactions: item.reactions || { views: 0, likes: 0 }
        }));
        return {
          entity,
          Data: processedListData,
          totalCount,
          totalPages,
          currentPage,
        }
      },
    }),

    //______________________________________________
    itemsListReadr: builder.mutation({
      query: ({ entity, page = 1, max = 200, filters }) => {
        let targetURL = `/${entity}?page=${page}&limit=${max}`
        if (filters && Object.keys(filters).length > 0) {
          const searchParams = new URLSearchParams(filters);
          const params = searchParams.toString();
          targetURL = `/${entity}?page=${page}&limit=${max}&${params}`
        }
        // console.log("____________________________________")
        // console.log("<<>>>-targetURL =", targetURL)
        return ({
          url: targetURL,
          method: "GET",
        })
      },
      transformResponse: ({ data }, _, { entity, filters }) => {
        const { list, pagination: { totalCount, totalPages, currentPage } = {} } = data || {};
        const isOpportunityRecommendationRequest = (entity === "opportunity") && filters?.recommendByTags;
        const processedListData = (list || []).map(item => ({
          ...item,
          seekerProfileId: isOpportunityRecommendationRequest ? filters?.profileId : undefined,
          createdAt: item.createdAt || sub(new Date(), { minutes: 1 }).toISOString(),
          created_at: item.created_at || sub(new Date(), { minutes: 1 }).toISOString(),
          reactions: item.reactions || { views: 0, likes: 0 }
        }));

        // console.log("<<>>>-processedListData =", processedListData)

        return {
          entity: isOpportunityRecommendationRequest ? "opportunityrecommendation" : entity,
          Data: processedListData,
          totalCount,
          totalPages,
          currentPage,
        }
      },
    }),

    //______________________________________________
    itemDetailsViewer: builder.query({
      query: ({ entity, guid }) => `/${entity}/${guid}`,
      transformResponse: ({ msg, data }, _, { entity }) => {
        const { applications, profiles, opportunities, messages } = data || {}
        return {
          entity,
          Data: data,
          Message: msg,
          applications,
          profiles,
          opportunities,
          messages
        };
      }
    }),

    //______________________________________________
    itemFieldsUpdater: builder.mutation({
      query: ({ entity, submissionEndpoint, data, guid }) => {
        const url = `/${submissionEndpoint || entity}/${guid}`
        return ({
          url,
          method: "PUT",
          body: data,
        })
      },
      transformResponse: ({ msg, data }, _, { entity }) => {
        return { entity, Message: msg, Data: data };
      },
      invalidatesTags: (result, err, { entity }) => [{ type: entity, id: "LIST" }]
    }),

    //______________________________________________
    itemFieldPatcher: builder.mutation({
      query: ({ entity, submissionEndpoint, data, guid }) => {
        const url = `/${submissionEndpoint || entity}/${guid}`
        return ({
          url,
          method: "PATCH",
          body: data,
        })
      },
      transformResponse: ({ msg, data }, _, { entity }) => {
        return { entity, Message: msg, Data: data };
      },
      invalidatesTags: (result, err, { entity }) => [{ type: entity, id: "LIST" }]
    }),

    //______________________________________________
    itemRemover: builder.mutation({
      query: ({ entity, guid }) => ({
        url: `/${entity}/${guid}`,
        method: "DELETE"
      }),
      transformResponse: ({ msg, data }, _, { entity, guid }) => {
        return { entity, entityGuid: guid, Message: msg, Data: data };
      },
      invalidatesTags: (result, err, { entity }) => [{ type: entity, id: "LIST" }]
    }),

    //______________________________________________
    addReaction: builder.mutation({
      query: ({ entity, guid, userGuid, newReactions }) => ({
        url: `/${entity}/${guid}`,
        method: 'PATCH',
        body: { user_guid: userGuid, reactions: newReactions }
      }),
      async onQueryStarted({ entity, guid, oldReactions, newReactions, updateReactions }, { dispach, queryFulfilled }) {
        if (updateReactions) {
          dispach(updateReactions({ entity, guid, reactions: newReactions }))
        }
        try {
          await queryFulfilled
        } catch {
          dispach(updateReactions({ entity, guid, reactions: oldReactions }))
        }
      }
    }),

    //______________________________________________
    httpMessageSender: builder.mutation({
      query: ({ channel, senderProfileId, topic, channelType, content, contentType, fileCaption, opportunityId, applicationId }) => {
        return ({
          url: `/message`,
          method: "POST",
          body: { senderProfileId, topic, channelType, content, contentType, fileCaption, channel, opportunityId, applicationId },
        })
      },
      transformResponse({ data }, _, { senderProfileId, topic, channelType, content, contentType, file, fileCaption, channel, opportunityId, applicationId }) {
        return {
          senderProfileId,
          topic,
          channelType,
          content,
          contentType,
          file,
          fileCaption,
          channel,
          Data: data,
          opportunityId,
          applicationId,
        }
      },
    }),

    //______________________________________________
    // websocketMessageSender: builder.mutation({
    //   query: ({ type = "subscribe", topic = "message", channel }) => ({
    //     url: `${WEBSOCKET_BASE_URL}:${WEBSOCKET_PORT}/api/reech-websocket-api/`,
    //     method: 'POST',
    //     body: { type, topic, channel },
    //   }),
    // }),

    //______________________________________________
    streamDataReader: builder.mutation({
      query: ({ entity = "message", filters }) => {
        let targetURL = `/${entity}`;
        if (filters && Object.keys(filters).length > 0) {
          const searchParams = new URLSearchParams(filters);
          const params = searchParams.toString();
          targetURL = `/${entity}?${params}`
        }
        return ({
          url: targetURL,
          method: "GET",
        })
      },
      transformResponse({ data }, _, { entity }) {
        return {
          entity,
          Data: data,
        }
      },
      async onCacheEntryAdded({ streamDataReceivedCallback }, { dispach, cacheDataLoaded, cacheEntryRemoved }) {
        let ws;
        ws = getWebSocketInstance(`wss://reech-node-api-7o3szyfdpq-uc.a.run.app/`)
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded;
          ws.addEventListener("message", (event) => {
            let decodedData = {}
            if (isValidJsonString(event)) {
              decodedData = JSON.parse(event.data)
            } else {
              console.warn("Failed to decode data received from the backend because it is not a valid json string")
            }
            const { topic } = decodedData;
            const processedListData = {
              ...decodedData,
              createdAt: decodedData.createdAt || sub(new Date(), { minutes: 1 }).toISOString(),
              created_at: decodedData.created_at || sub(new Date(), { minutes: 1 }).toISOString(),
              reactions: decodedData.reactions || { views: 0, likes: 0 }
            };
            return dispach(streamDataReceivedCallback({ topic, Data: processedListData }));
          })
        } catch (e) {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        ws.close()
      },
    }),

    //.....

  })
}, {
  overrideExisting: true
})

export const {
  useLoadServiceFunctionsMutation,
  useUserLoginAttemptMutation,
  useUserLoginResendOTPMutation,
  useUserLoginMutation,
  useItemRegistrerMutation,
  useFileUploaderMutation,
  useItemsListReaderQuery,
  useItemsListReadrMutation,
  useListOptionsQuery,
  useListOptionzMutation,
  useItemDetailsViewerQuery,
  useItemFieldsUpdaterMutation,
  useItemFieldPatcherMutation,
  useAddReactionMutation,
  useItemRemoverMutation,
  useFormLoaderQuery,
  useGoogleLoginMutation,
  useHttpMessageSenderMutation,
  // useWebsocketMessageSenderMutation,
  useStreamDataReaderMutation,
  useOtpVerifierMutation,
  useOtpSmsSenderMutation,
  useOtpEmailSenderMutation,
} = sharedCrudApi






