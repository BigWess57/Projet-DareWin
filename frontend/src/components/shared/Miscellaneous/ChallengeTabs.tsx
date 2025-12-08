import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";



import ChallengePreview from "./ChallengePreview";
import { Challenge } from "../RouteBaseElements/ChallengeList";
import { Address } from "viem";
import PaginatedTabContent from "./PaginatedTabContent";


interface ChallengeTabsProps {
  challengesCreated: Challenge[];
  challengesJoined: Challenge[];
  latestChallenges: Challenge[];
  handleChallengeClick: (addr: Address) => void;
}

export function ChallengeTabs({
  challengesCreated,
  challengesJoined,
  latestChallenges,
  handleChallengeClick,
}: ChallengeTabsProps) {

  const t = useTranslations('MyChallenges.ChallengeTabs');
  const ITEMS_PER_PAGE = 5; //Default value

  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const handleItemsPerPageChange = (value: string) => {
    const n = parseInt(value, 10);
    setItemsPerPage(n);
  };


  return (
    <div className="p-10 flex flex-col gap-10">
      <Tabs defaultValue="created">
        <TabsList
            className="
            bg-[#0B1126]
            border border-white/10
            rounded-xl
            p-1
            flex gap-2
            justify-start
            mb-6
            "
        >
          <TabsTrigger
            value="created"
            className="
              data-[state=active]:bg-white/10
              data-[state=active]:text-white
              text-white/70
              font-medium
              rounded-lg
              px-4 py-2
              transition
              hover:text-white
            "
          >
            {t('tab_created')}
          </TabsTrigger>

          <TabsTrigger
            value="joined"
            className="
              data-[state=active]:bg-white/10
              data-[state=active]:text-white
              text-white/70
              font-medium
              rounded-lg
              px-4 py-2
              transition
              hover:text-white
            "
          >
            {t('tab_joined')}
          </TabsTrigger>

          <TabsTrigger
            value="recent"
            className="
              data-[state=active]:bg-white/10
              data-[state=active]:text-white
              text-white/70
              font-medium
              rounded-lg
              px-4 py-2
              transition
              hover:text-white
            "
          >
            {t('tab_recent')}
          </TabsTrigger>
        </TabsList>



        <TabsContent value="created">
          <div className="text-3xl font-bold mb-4">{t('section_created')}</div>

          <PaginatedTabContent
            key={itemsPerPage}
            items={challengesCreated}
            itemsPerPage={itemsPerPage}
            handleItemsPerPageChange={handleItemsPerPageChange}
            renderItem={(challenge) => (
              <div 
                key={challenge.contractAddress} 
                className="transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer" 
                onClick={() => handleChallengeClick(challenge.contractAddress)}
              >
                <ChallengePreview challenge={challenge} />
              </div>
            )}
            emptyMessage={t('empty_created')}
          />
        </TabsContent>


        <TabsContent value="joined">
          <div className="text-3xl font-bold mb-4">{t('section_joined')}</div>

          <PaginatedTabContent
            key={itemsPerPage}
            items={challengesJoined}
            itemsPerPage={itemsPerPage}
            handleItemsPerPageChange={handleItemsPerPageChange}
            renderItem={(challenge) => (
              <div 
                key={challenge.contractAddress} 
                className="transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer" 
                onClick={() => handleChallengeClick(challenge.contractAddress)}
              >
                <ChallengePreview challenge={challenge} />
              </div>
            )}
            emptyMessage={t('empty_joined')}
          />
        </TabsContent>


        <TabsContent value="recent">
          <div className="text-3xl font-bold mb-4">{t('section_recent')}</div>

          <PaginatedTabContent
            key={itemsPerPage}
            items={latestChallenges}
            itemsPerPage={itemsPerPage}
            handleItemsPerPageChange={handleItemsPerPageChange}
            renderItem={(challenge) => (
              <div 
                key={challenge.contractAddress} 
                className="transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer" 
                onClick={() => handleChallengeClick(challenge.contractAddress)}
              >
                <ChallengePreview challenge={challenge} />
              </div>
            )}
            emptyMessage={t('empty_recent')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}